import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

// Normalize title: collapse whitespace + newlines, trim, lowercase for matching
function norm(s: string): string {
  return s.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().toLowerCase();
}

function readStr(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "richText" in v)
    return (v as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join("");
  if (typeof v === "object" && "result" in v) {
    const r = (v as ExcelJS.CellFormulaValue).result;
    return r === null || r === undefined ? "" : String(r);
  }
  if (typeof v === "object" && "text" in v)
    return String((v as ExcelJS.CellHyperlinkValue).text ?? "");
  if (v instanceof Date) return "";
  return String(v);
}

function readNum(cell: ExcelJS.Cell): number | null {
  const v = cell.value;
  if (v === null || v === undefined) return null;
  if (typeof v === "object" && "result" in v) {
    const r = (v as ExcelJS.CellFormulaValue).result;
    const n = typeof r === "number" ? r : parseFloat(String(r ?? ""));
    return isNaN(n) ? null : n;
  }
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isNaN(n) ? null : n;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role === "MEMBER") return Response.json({ error: "Forbidden" }, { status: 403 });

  let fileBuffer: ArrayBuffer;
  let leadId: string;
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") return Response.json({ error: "File tidak ditemukan." }, { status: 400 });
    fileBuffer = await (file as File).arrayBuffer();
    leadId = (formData.get("leadId") as string) ?? session.user.id;
  } catch {
    return Response.json({ error: "Gagal membaca form." }, { status: 400 });
  }

  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(fileBuffer); } catch {
    return Response.json({ error: "File Excel tidak valid." }, { status: 400 });
  }

  let sheet: ExcelJS.Worksheet | undefined = wb.getWorksheet("Distribusi");
  if (!sheet) {
    for (const ws of wb.worksheets) {
      if (!/petunjuk/i.test(ws.name)) { sheet = ws; break; }
    }
  }
  if (!sheet) return Response.json({ error: "Sheet 'Distribusi' tidak ditemukan." }, { status: 400 });

  const activeQuarter = await prisma.quarter.findFirst({ where: { isActive: true } });
  if (!activeQuarter) return Response.json({ error: "Tidak ada quarter aktif." }, { status: 400 });

  // Fetch objectives + KRs
  const objectives = await prisma.objective.findMany({
    where: { userId: leadId, quarterId: activeQuarter.id },
    include: { keyResults: true },
  });

  if (objectives.length === 0)
    return Response.json({ error: "Belum ada objective untuk quarter aktif. Buat objective dulu di halaman OKR." }, { status: 400 });

  // Build lookup maps — use normalized titles
  const objByTitle = new Map(objectives.map((o) => [norm(o.title), o]));
  // KR lookup: composite key "objId::krTitle" to avoid collision across objectives
  const krByKey = new Map(
    objectives.flatMap((o) => o.keyResults.map((kr) => [`${o.id}::${norm(kr.title)}`, kr]))
  );

  // ── Parse rows ───────────────────────────────────────────────────────────────
  // Template columns: A=Anggota, B=Objective, C=Bobot Obj, D=Key Result, E=Target Individu, F=Satuan, G=Bobot KR
  type RowData = {
    memberName: string; objectiveTitle: string; objectiveWeight: number;
    krTitle: string; individualTarget: number | null; krWeight: number;
  };

  const rows: RowData[] = [];
  let lastMember = "";
  let lastObjective = "";
  let lastObjectiveWeight = 0;
  const parseErrors: string[] = [];

  const maxRow = sheet.rowCount;
  for (let rowNum = 3; rowNum <= maxRow; rowNum++) {
    const row = sheet.getRow(rowNum);

    const memberName  = readStr(row.getCell(1)).replace(/[\r\n]+/g, " ").trim();
    const objTitle    = readStr(row.getCell(2)).replace(/[\r\n]+/g, " ").trim();
    const objWeight   = readNum(row.getCell(3)) ?? lastObjectiveWeight;
    const krTitle     = readStr(row.getCell(4)).replace(/[\r\n]+/g, " ").trim();
    const indTarget   = readNum(row.getCell(5));
    const krWeight    = readNum(row.getCell(7)) ?? 0;

    if (memberName) { lastMember = memberName; }
    if (objTitle)   { lastObjective = objTitle; lastObjectiveWeight = objWeight; }
    else if (objWeight > 0) { lastObjectiveWeight = objWeight; }

    if (!krTitle) continue; // no KR = skip row

    if (!lastMember) {
      parseErrors.push(`Baris ${rowNum}: KR "${krTitle}" tidak punya anggota.`);
      continue;
    }
    if (!lastObjective) {
      parseErrors.push(`Baris ${rowNum}: KR "${krTitle}" tidak punya objective.`);
      continue;
    }

    rows.push({
      memberName: lastMember,
      objectiveTitle: lastObjective,
      objectiveWeight: lastObjectiveWeight,
      krTitle,
      individualTarget: indTarget,
      krWeight,
    });
  }

  if (rows.length === 0)
    return Response.json({
      error: "Tidak ada data KR yang terbaca. Pastikan kolom D (Key Result) terisi.",
      debug: { maxRow, parseErrors },
    }, { status: 400 });

  // ── Group: memberName → objectiveTitle(normalized) → { weight, krs[] } ──────
  type MemberGroup = Map<string, { objectiveTitle: string; objectiveWeight: number; krs: RowData[] }>;
  const grouped = new Map<string, MemberGroup>();

  for (const row of rows) {
    if (!grouped.has(row.memberName)) grouped.set(row.memberName, new Map());
    const mg = grouped.get(row.memberName)!;
    const objKey = norm(row.objectiveTitle);
    if (!mg.has(objKey)) mg.set(objKey, { objectiveTitle: row.objectiveTitle, objectiveWeight: row.objectiveWeight, krs: [] });
    mg.get(objKey)!.krs.push(row);
  }

  // ── Delete existing assignments ──────────────────────────────────────────────
  const existingMembers = await prisma.teamMember.findMany({
    where: { leadId },
    select: { id: true, name: true },
  });
  const existingMemberMap = new Map(existingMembers.map((m) => [norm(m.name), m]));

  const existingAssignments = await prisma.objectiveAssignment.findMany({
    where: { member: { leadId } },
    select: { id: true },
  });
  if (existingAssignments.length > 0) {
    await prisma.objectiveAssignment.deleteMany({
      where: { id: { in: existingAssignments.map((a) => a.id) } },
    });
  }

  let createdMembers = 0, createdAssignments = 0, createdKRAs = 0;
  const errors: string[] = [...parseErrors];

  // Debug: track what was found/not found
  const debugLookups: string[] = [];
  debugLookups.push(`DB objectives: ${[...objByTitle.keys()].join(" | ")}`);
  debugLookups.push(`DB KR keys (sample): ${[...krByKey.keys()].slice(0, 5).join(" | ")}`);
  debugLookups.push(`Parsed rows: ${rows.length}`);
  const uniqueObjTitles = [...new Set(rows.map((r) => norm(r.objectiveTitle)))];
  debugLookups.push(`File obj norms: ${uniqueObjTitles.join(" | ")}`);
  const uniqueKRTitles = [...new Set(rows.map((r) => norm(r.krTitle)))];
  debugLookups.push(`File KR norms: ${uniqueKRTitles.join(" | ")}`);

  for (const [memberName, memberGroup] of grouped) {
    // Find or create member
    let member = existingMemberMap.get(norm(memberName));
    if (!member) {
      try {
        member = await prisma.teamMember.create({ data: { name: memberName, leadId } });
        existingMemberMap.set(norm(memberName), member);
        createdMembers++;
      } catch (e) {
        errors.push(`Gagal buat anggota "${memberName}": ${String(e)}`);
        continue;
      }
    }

    for (const [, { objectiveTitle, objectiveWeight, krs }] of memberGroup) {
      const objNorm = norm(objectiveTitle);
      const obj = objByTitle.get(objNorm);
      debugLookups.push(`Lookup obj "${objNorm}" → ${obj ? `FOUND (${obj.id.slice(-6)})` : "NOT FOUND"}`);
      if (!obj) {
        errors.push(`❌ Objective tidak ditemukan di DB: "${objectiveTitle}"`);
        continue;
      }

      let assignment;
      try {
        assignment = await prisma.objectiveAssignment.create({
          data: { memberId: member.id, objectiveId: obj.id, weight: objectiveWeight },
        });
        createdAssignments++;
      } catch (e) {
        errors.push(`❌ Assignment ${memberName}→${obj.title}: ${String(e)}`);
        continue;
      }

      for (const kra of krs) {
        const krNorm = norm(kra.krTitle);
        const krKey = `${obj.id}::${krNorm}`;
        const kr = krByKey.get(krKey);
        debugLookups.push(`  Lookup KR key "${krKey.slice(-40)}" → ${kr ? `FOUND` : "NOT FOUND"}`);
        if (!kr) {
          // Try fuzzy: find any KR in this obj whose title contains the kra title or vice versa
          const fuzzy = obj.keyResults.find(
            (k) => norm(k.title).includes(krNorm) || krNorm.includes(norm(k.title))
          );
          debugLookups.push(`  Fuzzy for "${krNorm}" → ${fuzzy ? `FOUND "${fuzzy.title.slice(0, 30)}"` : "NOT FOUND"}`);
          if (!fuzzy) {
            errors.push(`❌ KR tidak ditemukan: "${kra.krTitle}" di obj "${obj.title}". KR yg ada: ${obj.keyResults.map((k) => `"${k.title}"`).join(", ")}`);
            continue;
          }
          try {
            await prisma.kRAssignment.create({
              data: { assignmentId: assignment.id, keyResultId: fuzzy.id, weight: kra.krWeight, progress: 0, target: kra.individualTarget },
            });
            createdKRAs++;
          } catch (e) {
            errors.push(`❌ KRA (fuzzy) ${memberName}→"${kra.krTitle}": ${String(e)}`);
          }
          continue;
        }

        try {
          await prisma.kRAssignment.create({
            data: { assignmentId: assignment.id, keyResultId: kr.id, weight: kra.krWeight, progress: 0, target: kra.individualTarget },
          });
          createdKRAs++;
        } catch (e) {
          errors.push(`❌ KRA ${memberName}→"${kra.krTitle}": ${String(e)}`);
        }
      }
    }
  }

  return Response.json({
    success: true,
    message: `Berhasil: ${createdAssignments} assignment, ${createdKRAs} KR assignment dibuat.` +
      (createdMembers > 0 ? ` (${createdMembers} anggota baru)` : ""),
    created: { members: createdMembers, assignments: createdAssignments, krAssignments: createdKRAs },
    errors: errors.length > 0 ? errors : undefined,
    debug: { rowsParsed: rows.length, lookups: debugLookups },
  });
}
