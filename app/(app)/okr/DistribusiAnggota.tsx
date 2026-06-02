"use client";

import { useRef, useState, useEffect } from "react";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";

type KRAssignment = {
  id: string;
  weight: number;
  progress: number;
  target: number | null;   // individual target override
  keyResultId: string;
  keyResult?: { id: string; title: string; target: number; unit: string } | null;
};

type Assignment = {
  id: string;
  weight: number;
  objectiveId: string;
  objective: { id: string; title: string };
  krAssignments: KRAssignment[];
};

type Member = {
  id: string;
  name: string;
  assignments: Assignment[];
};

type KeyResult = {
  id: string;
  title: string;
  target: number;
  unit: string;
};

type Objective = {
  id: string;
  title: string;
  keyResults: KeyResult[];
};

type Props = {
  initialMembers: Member[];
  objectives: Objective[];
  leadId: string;
  quarterId: string;
  leadDivision?: string;
};

const btnDanger = "text-slate-300 hover:text-red-500 transition-colors duration-100";

// ─── KR row ───────────────────────────────────────────────────────────────────

function KRRow({
  kra, kr, onWeightChange, onProgressChange, onTargetChange, onRemove,
}: {
  kra: KRAssignment;
  kr: KeyResult;
  onWeightChange: (id: string, val: number) => void;
  onProgressChange: (id: string, val: number) => void;
  onTargetChange: (id: string, val: number | null) => void;
  onRemove: (id: string) => void;
}) {
  const effectiveTarget = kra.target ?? kr.target;
  const pct = effectiveTarget > 0 ? Math.min((kra.progress / effectiveTarget) * 100, 100) : 0;
  const pctColor = pct >= 100 ? "text-green-700 bg-green-100" : pct >= 70 ? "text-amber-700 bg-amber-100" : "text-red-600 bg-red-100";
  const barColor = pct >= 100 ? "bg-green-500" : pct >= 70 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-slate-700 leading-snug">🔑 {kr.title}</span>
        <button onClick={() => onRemove(kra.id)} className={`${btnDanger} flex-shrink-0 mt-0.5`}>
          <Trash2 size={12} />
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Weight */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">⚖️ Bobot</span>
          <input
            type="number"
            className="w-14 border border-slate-200 rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:border-amber-400 bg-slate-50"
            value={kra.weight}
            min={0} max={100} step={1}
            onChange={(e) => onWeightChange(kra.id, Number(e.target.value))}
          />
          <span className="text-xs text-slate-400">%</span>
        </div>

        {/* Individual target */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">🎯 Target</span>
          <input
            type="number"
            className={`w-20 border rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:border-amber-400 ${
              kra.target !== null
                ? "border-amber-300 bg-amber-50 text-amber-800 font-semibold"
                : "border-slate-200 bg-slate-50 text-slate-400"
            }`}
            placeholder={String(kr.target)}
            value={kra.target ?? ""}
            min={0}
            onChange={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              onTargetChange(kra.id, v);
            }}
          />
          <span className="text-xs text-slate-400">{kr.unit}</span>
          {kra.target !== null && (
            <button
              onClick={() => onTargetChange(kra.id, null)}
              className="text-slate-300 hover:text-slate-500 text-xs transition"
              title="Reset ke target divisi"
            >✕</button>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1.5 flex-1">
          <span className="text-xs text-slate-400 flex-shrink-0">📈 Progress</span>
          <input
            type="number"
            className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:border-amber-400 bg-slate-50"
            value={kra.progress}
            min={0}
            onChange={(e) => onProgressChange(kra.id, Number(e.target.value))}
          />
          <span className="text-xs text-slate-400 flex-shrink-0">/ {effectiveTarget} {kr.unit}</span>
        </div>

        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${pctColor}`}>
          {pct.toFixed(0)}%
        </span>
      </div>

      {kra.target !== null && (
        <p className="text-xs text-amber-600">
          ⚡ Target individu: <strong>{kra.target} {kr.unit}</strong> (divisi: {kr.target} {kr.unit})
        </p>
      )}

      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-1 rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Assignment row ───────────────────────────────────────────────────────────

function AssignmentRow({
  assignment, objectives, onRemove, onWeightChange, onAddKR, onRemoveKR,
  onKRWeightChange, onKRProgressChange, onKRTargetChange,
}: {
  assignment: Assignment;
  objectives: Objective[];
  onRemove: (id: string) => void;
  onWeightChange: (id: string, val: number) => void;
  onAddKR: (assignmentId: string, keyResultId: string) => void;
  onRemoveKR: (kraId: string, assignmentId: string) => void;
  onKRWeightChange: (kraId: string, assignmentId: string, val: number) => void;
  onKRProgressChange: (kraId: string, assignmentId: string, val: number) => void;
  onKRTargetChange: (kraId: string, assignmentId: string, val: number | null) => void;
}) {
  const [open, setOpen] = useState(true);
  const obj = objectives.find((o) => o.id === assignment.objectiveId);
  const allKRs = obj?.keyResults ?? [];
  const assignedKRIds = new Set(assignment.krAssignments.map((kra) => kra.keyResultId));
  const unassignedKRs = allKRs.filter((kr) => !assignedKRIds.has(kr.id));
  const krTotal = assignment.krAssignments.reduce((s, kra) => s + Number(kra.weight), 0);
  const krOk = assignment.krAssignments.length > 0 && Math.abs(krTotal - 100) < 0.1;

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50">
        <span className="flex-1 text-sm font-semibold text-slate-700 truncate">🎯 {assignment.objective.title}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-slate-400">⚖️</span>
          <input
            type="number"
            className="w-14 border border-slate-200 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:border-amber-400 bg-white"
            value={assignment.weight}
            min={0} max={100}
            onChange={(e) => onWeightChange(assignment.id, Number(e.target.value))}
          />
          <span className="text-xs text-slate-400">%</span>
        </div>
        <button onClick={() => onRemove(assignment.id)} className={btnDanger}>
          <Trash2 size={13} />
        </button>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 w-full text-left border-t border-slate-100 hover:bg-slate-50/50 transition"
      >
        {open ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
        <span className="text-xs text-slate-500">🔑 Key Results ({assignment.krAssignments.length} dipilih)</span>
        {assignment.krAssignments.length > 0 && (
          <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-md ${krOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {krTotal.toFixed(0)}%{krOk ? " ✅" : " · harus 100%"}
          </span>
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2">
          {assignment.krAssignments.map((kra) => {
            // Prefer embedded keyResult (from include), fall back to objectives lookup
            const kr = kra.keyResult ?? allKRs.find((k) => k.id === kra.keyResultId) ?? null;
            return kr ? (
              <KRRow
                key={kra.id}
                kra={kra}
                kr={kr}
                onWeightChange={(id, val) => onKRWeightChange(id, assignment.id, val)}
                onProgressChange={(id, val) => onKRProgressChange(id, assignment.id, val)}
                onTargetChange={(id, val) => onKRTargetChange(id, assignment.id, val)}
                onRemove={(id) => onRemoveKR(id, assignment.id)}
              />
            ) : null;
          })}

          {unassignedKRs.length > 0 && (
            <select
              className="w-full border border-dashed border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-amber-400 bg-white cursor-pointer hover:border-amber-300 transition"
              value=""
              onChange={(e) => { if (e.target.value) onAddKR(assignment.id, e.target.value); }}
            >
              <option value="">➕ Pilih Key Result...</option>
              {unassignedKRs.map((kr) => (
                <option key={kr.id} value={kr.id}>{kr.title} (target divisi: {kr.target} {kr.unit})</option>
              ))}
            </select>
          )}

          {allKRs.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-2">Objective ini belum punya Key Result.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────

function MemberCard({
  member, objectives, onDelete, onAddAssignment, onRemoveAssignment,
  onWeightChange, onAddKR, onRemoveKR, onKRWeightChange, onKRProgressChange, onKRTargetChange,
}: {
  member: Member;
  objectives: Objective[];
  onDelete: (id: string) => void;
  onAddAssignment: (memberId: string, objectiveId: string) => void;
  onRemoveAssignment: (assignmentId: string, memberId: string) => void;
  onWeightChange: (assignmentId: string, memberId: string, val: number) => void;
  onAddKR: (assignmentId: string, memberId: string, keyResultId: string) => void;
  onRemoveKR: (kraId: string, assignmentId: string, memberId: string) => void;
  onKRWeightChange: (kraId: string, assignmentId: string, memberId: string, val: number) => void;
  onKRProgressChange: (kraId: string, assignmentId: string, memberId: string, val: number) => void;
  onKRTargetChange: (kraId: string, assignmentId: string, memberId: string, val: number | null) => void;
}) {
  const [open, setOpen] = useState(true);
  const totalWeight = member.assignments.reduce((s, a) => s + Number(a.weight), 0);
  const assignedObjectiveIds = new Set(member.assignments.map((a) => a.objectiveId));
  const unassigned = objectives.filter((o) => !assignedObjectiveIds.has(o.id));
  const objOk = Math.abs(totalWeight - 100) < 0.1;
  const initials = member.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header — click anywhere except delete to toggle */}
      <div
        className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none hover:bg-slate-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm">👤 {member.name}</p>
            <p className="text-xs text-slate-400">{member.assignments.length} objective · {open ? "klik untuk tutup" : "klik untuk buka"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
            objOk ? "bg-green-100 text-green-700"
            : totalWeight > 100 ? "bg-red-100 text-red-600"
            : "bg-slate-100 text-slate-500"
          }`}>
            {totalWeight}%{objOk ? " ✅" : ""}
          </span>
          <span className="text-slate-300">
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(member.id); }}
            className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50
              shadow-[0_3px_0_#e2e8f0] hover:shadow-[0_1px_0_#fecaca] hover:translate-y-0.5
              active:shadow-none active:translate-y-[3px] transition-all duration-75"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="px-4 py-2 border-t border-slate-100">
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-1 rounded-full transition-all ${totalWeight > 100 ? "bg-red-400" : "bg-amber-400"}`}
                style={{ width: `${Math.min(totalWeight, 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 space-y-2">
            {member.assignments.map((a) => (
              <AssignmentRow
                key={a.id}
                assignment={a}
                objectives={objectives}
                onRemove={(id) => onRemoveAssignment(id, member.id)}
                onWeightChange={(id, val) => onWeightChange(id, member.id, val)}
                onAddKR={(assignmentId, krId) => onAddKR(assignmentId, member.id, krId)}
                onRemoveKR={(kraId, assignmentId) => onRemoveKR(kraId, assignmentId, member.id)}
                onKRWeightChange={(kraId, assignmentId, val) => onKRWeightChange(kraId, assignmentId, member.id, val)}
                onKRProgressChange={(kraId, assignmentId, val) => onKRProgressChange(kraId, assignmentId, member.id, val)}
                onKRTargetChange={(kraId, assignmentId, val) => onKRTargetChange(kraId, assignmentId, member.id, val)}
              />
            ))}

            {unassigned.length > 0 && (
              <select
                className="w-full border border-dashed border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-400 focus:outline-none focus:border-amber-400 bg-white cursor-pointer hover:border-amber-300 transition"
                value=""
                onChange={(e) => { if (e.target.value) onAddAssignment(member.id, e.target.value); }}
              >
                <option value="">➕ Tambah objective...</option>
                {unassigned.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
            )}

            {objectives.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-3">🎯 Buat objective dulu di atas.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Excel Import/Export ──────────────────────────────────────────────────────

type ImportResult = { type: "success" | "error"; message: string; errors?: string[]; debug?: { rowsParsed: number; lookups?: string[] } };
type PreviewRow = { r: number; A: string; B: string; C: string; D: string; E: string; F: string; G: string };
type MatchInfo = { title: string; matched: boolean; dbTitle?: string | null };
type PreviewResult = {
  sheetNames: string[]; selectedSheet: string; selectedQuarter?: string | null; maxRow: number;
  rows: PreviewRow[];
  matching: { objectives: MatchInfo[]; keyResults: MatchInfo[] };
  db: { objectives: string[]; keyResults: string[] };
  error?: string;
  quarterHint?: string | null;
};

function DistribusiExcel({ leadId, objectives, quarterId }: { leadId: string; objectives: Objective[]; quarterId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);

  function handleTemplate() { window.location.href = `/api/distribusi/template?leadId=${leadId}&quarterId=${quarterId}`; }
  function handleExport() { window.location.href = `/api/distribusi/export?leadId=${leadId}&quarterId=${quarterId}`; }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setResult(null);
    setPreview(null);
    const form = new FormData();
    form.append("file", file);
    form.append("leadId", leadId);
    try {
      const res = await fetch(`/api/distribusi/import?leadId=${encodeURIComponent(leadId)}&quarterId=${encodeURIComponent(quarterId)}`, { method: "POST", body: form });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ type: "success", message: data.message, errors: data.errors, debug: data.debug });
        if (!data.errors?.length && data.created?.krAssignments > 0) {
          setTimeout(() => window.location.reload(), 1400);
        }
      } else {
        setResult({ type: "error", message: data.error ?? "Import gagal.", errors: data.errors, debug: data.debug });
      }
    } catch {
      setResult({ type: "error", message: "Terjadi kesalahan jaringan." });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handlePreview(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewing(true);
    setPreview(null);
    const form = new FormData();
    form.append("file", file);
    form.append("leadId", leadId);
    try {
      const res = await fetch(`/api/distribusi/preview?leadId=${encodeURIComponent(leadId)}&quarterId=${encodeURIComponent(quarterId)}`, { method: "POST", body: form });
      setPreview(await res.json());
    } catch {
      setPreview({ sheetNames: [], selectedSheet: "", maxRow: 0, rows: [], matching: { objectives: [], keyResults: [] }, db: { objectives: [], keyResults: [] }, error: "Gagal membaca file." });
    } finally {
      setPreviewing(false);
      if (previewRef.current) previewRef.current.value = "";
    }
  }

  const btnBase = "flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-xl transition-all duration-75 ";
  const btnSlate  = btnBase + "bg-white text-slate-700 border border-slate-200 shadow-[0_4px_0_#e2e8f0] hover:shadow-[0_2px_0_#e2e8f0] hover:translate-y-0.5 active:shadow-[0_1px_0_#e2e8f0] active:translate-y-[3px]";
  const btnAmber  = btnBase + "bg-amber-400 text-gray-900 shadow-[0_4px_0_#d97706] hover:shadow-[0_2px_0_#d97706] hover:translate-y-0.5 active:shadow-[0_1px_0_#d97706] active:translate-y-[3px] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0";
  const btnGreen  = btnBase + "bg-emerald-500 text-white shadow-[0_4px_0_#059669] hover:shadow-[0_2px_0_#059669] hover:translate-y-0.5 active:shadow-[0_1px_0_#059669] active:translate-y-[3px]";
  const btnViolet = btnBase + "bg-violet-100 text-violet-700 border border-violet-200 shadow-[0_4px_0_#ddd6fe] hover:shadow-[0_2px_0_#ddd6fe] hover:translate-y-0.5 active:shadow-[0_1px_0_#ddd6fe] active:translate-y-[3px]";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <span>📥</span>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Import / Export Distribusi</h3>
          <p className="text-xs text-slate-400">Template sudah berisi daftar objective & KR. Tinggal isi anggota, bobot, & target individu.</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <button onClick={handleTemplate} className={btnSlate} disabled={objectives.length === 0}>📋 Download Template</button>
          <label className={btnAmber + " cursor-pointer"}>
            {importing ? <><span className="animate-spin">⏳</span> Mengimpor…</> : <>📤 Import Excel</>}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={handleExport} className={btnGreen}>📥 Export</button>
          <label className={btnViolet + " cursor-pointer"} title="Cek isi file & matching sebelum import">
            {previewing ? <><span className="animate-spin">⏳</span></> : <>🔍 Preview</>}
            <input ref={previewRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handlePreview} disabled={previewing} />
          </label>
        </div>

        {objectives.length === 0 && <p className="text-xs text-slate-400 italic">⚠️ Buat objective dulu sebelum download template.</p>}

        {result && (
          <div className="space-y-2">
            <div className={`rounded-xl px-4 py-2.5 text-sm flex items-start gap-2 ${result.type === "success" && !result.errors?.length ? "bg-green-50 border border-green-200 text-green-700" : result.type === "success" ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
              <span className="flex-shrink-0">{result.type === "success" && !result.errors?.length ? "✅" : result.type === "success" ? "⚠️" : "❌"}</span>
              <div className="min-w-0 w-full">
                <p className="font-semibold">{result.message}</p>
                {result.debug && <p className="text-xs mt-0.5 opacity-70">Baris terbaca: {result.debug.rowsParsed}</p>}
                {result.type === "success" && !result.errors?.length && <p className="text-xs mt-0.5 opacity-75">Halaman akan dimuat ulang…</p>}
              </div>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
                <p className="text-xs font-bold text-red-700">⚠️ {result.errors.length} masalah ditemukan:</p>
                <ul className="space-y-1">
                  {result.errors.map((e, i) => <li key={i} className="text-xs text-red-700 font-mono break-all">• {e}</li>)}
                </ul>
              </div>
            )}
            {result.debug?.lookups && result.debug.lookups.length > 0 && (
              <details className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <summary className="px-4 py-2 bg-slate-50 cursor-pointer text-slate-600 font-semibold">🔍 Debug lookup ({result.debug.lookups.length} baris)</summary>
                <div className="px-4 py-3 font-mono space-y-0.5 max-h-48 overflow-y-auto">
                  {result.debug.lookups.map((l, i) => (
                    <p key={i} className={`text-xs break-all ${l.includes("NOT FOUND") ? "text-red-600 font-bold" : l.includes("FOUND") ? "text-green-700" : "text-slate-500"}`}>{l}</p>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Preview panel */}
        {preview && (
          <div className="border border-violet-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-violet-50 px-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="font-bold text-violet-800">🔍 Preview — sheet: {preview.selectedSheet}</p>
                <p className="text-violet-500">
                  {preview.maxRow} baris · sheets: {preview.sheetNames.join(", ")}
                  {preview.selectedQuarter && <> · DB quarter: <strong>{preview.selectedQuarter}</strong></>}
                </p>
              </div>
              <button onClick={() => setPreview(null)} className="text-violet-400 hover:text-violet-700 text-base">✕</button>
            </div>

            {preview.quarterHint && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-start gap-2 text-amber-800">
                <span className="flex-shrink-0 text-base">⚠️</span>
                <p className="font-semibold">{preview.quarterHint}</p>
              </div>
            )}

            {preview.error && <p className="px-4 py-3 text-red-600">{preview.error}</p>}

            {/* Matching check */}
            {(preview.matching.objectives.length > 0 || preview.matching.keyResults.length > 0) && (
              <div className="px-4 py-3 border-b border-violet-100 space-y-2">
                <p className="font-semibold text-slate-600">📋 Matching dengan database:</p>
                <div className="space-y-1">
                  {preview.matching.objectives.map((o, i) => (
                    <div key={i} className={`flex items-start gap-2 ${o.matched ? "text-green-700" : "text-red-600"}`}>
                      <span className="flex-shrink-0">{o.matched ? "✅" : "❌"}</span>
                      <span className="font-mono break-all">[Obj] {o.title}</span>
                      {!o.matched && <span className="text-slate-400 ml-1">(tidak ditemukan di DB)</span>}
                    </div>
                  ))}
                  {preview.matching.keyResults.map((k, i) => (
                    <div key={i} className={`flex items-start gap-2 ${k.matched ? "text-green-700" : "text-red-600"}`}>
                      <span className="flex-shrink-0">{k.matched ? "✅" : "❌"}</span>
                      <span className="font-mono break-all">[KR] {k.title}</span>
                      {!k.matched && <span className="text-slate-400 ml-1">(tidak ditemukan)</span>}
                    </div>
                  ))}
                </div>

                {/* DB titles for reference if mismatch */}
                {preview.matching.objectives.some((o) => !o.matched) && (
                  <details className="mt-2">
                    <summary className="text-slate-500 cursor-pointer">📂 Objective di database ({preview.db.objectives.length})</summary>
                    <ul className="mt-1 space-y-0.5">
                      {preview.db.objectives.map((t, i) => <li key={i} className="font-mono text-slate-600 break-all">• {t}</li>)}
                    </ul>
                  </details>
                )}
                {preview.matching.keyResults.some((k) => !k.matched) && (
                  <details className="mt-2">
                    <summary className="text-slate-500 cursor-pointer">📂 KR di database ({preview.db.keyResults.length})</summary>
                    <ul className="mt-1 space-y-0.5">
                      {preview.db.keyResults.map((t, i) => <li key={i} className="font-mono text-slate-600 break-all">• {t}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            )}

            {/* Raw rows table */}
            <div className="overflow-x-auto">
              <table className="w-full font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["#","A Anggota","B Objective","C Bobot","D Key Result","E Target","F Satuan","G BobotKR"].map((h) => (
                      <th key={h} className="text-left px-2 py-1.5 text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => {
                    const isData = row.r >= 3 && !!row.D;
                    return (
                      <tr key={row.r} className={`border-b border-slate-100 ${row.r === 1 ? "bg-amber-50" : row.r === 2 ? "bg-slate-50" : isData ? "bg-white" : "bg-slate-50/40"}`}>
                        <td className="px-2 py-1 text-slate-400">{row.r}</td>
                        <td className={`px-2 py-1 max-w-[120px] truncate ${row.A ? "text-slate-800 font-bold" : "text-slate-300"}`}>{row.A || "—"}</td>
                        <td className="px-2 py-1 max-w-[120px] truncate text-slate-600">{row.B || "—"}</td>
                        <td className="px-2 py-1 text-slate-600">{row.C || "—"}</td>
                        <td className={`px-2 py-1 max-w-[140px] truncate ${row.D ? "text-slate-800" : "text-slate-300"}`}>{row.D || "—"}</td>
                        <td className="px-2 py-1 text-slate-600">{row.E || "—"}</td>
                        <td className="px-2 py-1 text-slate-600">{row.F || "—"}</td>
                        <td className="px-2 py-1 text-slate-600">{row.G || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="px-3 py-1.5 text-slate-400">Tampil 30 baris pertama · baris hijau = ada KR di kolom D</p>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700 space-y-1">
          <p className="font-semibold">💡 Tips</p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-600">
            <li>Klik <strong>🔍 Preview</strong> dulu untuk cek apakah nama objective & KR terbaca dengan benar sebelum import</li>
            <li>Kolom B (Objective) & D (Key Result) harus persis sama dengan yang ada di database</li>
            <li>Import menggantikan semua assignment yang ada</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Progress Excel Import ────────────────────────────────────────────────────

type ProgressImportResult = { type: "success" | "error"; message: string; errors?: string[] };

function ProgressExcel({ leadId, quarterId }: { leadId: string; quarterId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ProgressImportResult | null>(null);

  function handleTemplate() {
    window.location.href = `/api/progress/template?leadId=${encodeURIComponent(leadId)}&quarterId=${encodeURIComponent(quarterId)}`;
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setResult(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`/api/progress/import?leadId=${encodeURIComponent(leadId)}`, { method: "POST", body: form });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ type: "success", message: data.message, errors: data.errors });
        if (!data.errors?.length) setTimeout(() => window.location.reload(), 1400);
      } else {
        setResult({ type: "error", message: data.error ?? "Import gagal.", errors: data.errors });
      }
    } catch {
      setResult({ type: "error", message: "Terjadi kesalahan jaringan." });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
        <h3 className="font-bold text-slate-700 text-sm">📈 Update Progress OKR Individu via Excel</h3>
        <p className="text-xs text-slate-400 mt-0.5">Setelah OKR Divisi selesai & distribusi dilakukan, download template — template sudah berisi daftar OKR Individu semua anggota. Isi kolom Progress, lalu upload kembali.</p>
      </div>
      <div className="p-4 flex flex-wrap gap-2 items-center">
        <button
          onClick={handleTemplate}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700
            shadow-[0_3px_0_#e2e8f0] hover:shadow-[0_1px_0_#e2e8f0] hover:translate-y-0.5
            active:shadow-none active:translate-y-[3px] transition-all duration-75"
        >
          📥 Download Template Progress
        </button>

        <label className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl cursor-pointer
          bg-amber-400 text-gray-900 shadow-[0_3px_0_#d97706] hover:shadow-[0_1px_0_#d97706] hover:translate-y-0.5
          active:shadow-none active:translate-y-[3px] transition-all duration-75
          ${importing ? "opacity-50 pointer-events-none" : ""}`}
        >
          {importing ? "⏳ Mengimpor..." : "📤 Import Progress"}
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
        </label>
      </div>

      {result && (
        <div className={`mx-4 mb-4 rounded-xl px-4 py-3 text-sm ${result.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          <p className="font-semibold">{result.type === "success" ? "✅" : "❌"} {result.message}</p>
          {result.errors && result.errors.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs list-disc list-inside">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DistribusiAnggota({ initialMembers, objectives, leadId, quarterId, leadDivision }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; name: string; position: string | null }[]>([]);

  // Load all active employees for picker (no division filter to avoid mismatch)
  useEffect(() => {
    fetch("/api/employees?isActive=true")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setEmployees(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  async function addMember() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    const res = await fetch("/api/team-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, leadId }),
    });
    const m = await res.json();
    setMembers((prev) => [...prev, { ...m, assignments: [] }]);
    setNewName("");
    setSaving(false);
  }

  async function deleteMember(id: string) {
    if (!confirm("Hapus anggota ini beserta semua assignment-nya?")) return;
    await fetch(`/api/team-members/${id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function addAssignment(memberId: string, objectiveId: string) {
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, objectiveId, weight: 0 }),
    });
    const a = await res.json();
    const obj = objectives.find((o) => o.id === objectiveId);
    setMembers((prev) => prev.map((m) => m.id === memberId
      ? { ...m, assignments: [...m.assignments, { ...a, objective: obj!, krAssignments: [] }] }
      : m
    ));
  }

  async function removeAssignment(assignmentId: string, memberId: string) {
    await fetch(`/api/assignments/${assignmentId}`, { method: "DELETE" });
    setMembers((prev) => prev.map((m) => m.id === memberId
      ? { ...m, assignments: m.assignments.filter((a) => a.id !== assignmentId) }
      : m
    ));
  }

  async function updateWeight(assignmentId: string, memberId: string, weight: number) {
    setMembers((prev) => prev.map((m) => m.id === memberId
      ? { ...m, assignments: m.assignments.map((a) => a.id === assignmentId ? { ...a, weight } : a) }
      : m
    ));
    await fetch(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight }),
    });
  }

  async function addKR(assignmentId: string, memberId: string, keyResultId: string) {
    const res = await fetch("/api/kr-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, keyResultId, weight: 0, progress: 0, target: null }),
    });
    const kra = await res.json();
    // Embed the keyResult from our local objectives list so it renders without a page reload
    const krObj = objectives.flatMap((o) => o.keyResults).find((k) => k.id === keyResultId) ?? null;
    setMembers((prev) => prev.map((m) => m.id === memberId
      ? { ...m, assignments: m.assignments.map((a) => a.id === assignmentId
          ? { ...a, krAssignments: [...a.krAssignments, { ...kra, target: kra.target ?? null, keyResult: krObj }] }
          : a
        )}
      : m
    ));
  }

  async function removeKR(kraId: string, assignmentId: string, memberId: string) {
    await fetch(`/api/kr-assignments/${kraId}`, { method: "DELETE" });
    setMembers((prev) => prev.map((m) => m.id === memberId
      ? { ...m, assignments: m.assignments.map((a) => a.id === assignmentId
          ? { ...a, krAssignments: a.krAssignments.filter((kra) => kra.id !== kraId) }
          : a
        )}
      : m
    ));
  }

  async function updateKRWeight(kraId: string, assignmentId: string, memberId: string, weight: number) {
    setMembers((prev) => prev.map((m) => m.id === memberId
      ? { ...m, assignments: m.assignments.map((a) => a.id === assignmentId
          ? { ...a, krAssignments: a.krAssignments.map((kra) => kra.id === kraId ? { ...kra, weight } : kra) }
          : a
        )}
      : m
    ));
    await fetch(`/api/kr-assignments/${kraId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight }),
    });
  }

  async function updateKRProgress(kraId: string, assignmentId: string, memberId: string, progress: number) {
    setMembers((prev) => prev.map((m) => m.id === memberId
      ? { ...m, assignments: m.assignments.map((a) => a.id === assignmentId
          ? { ...a, krAssignments: a.krAssignments.map((kra) => kra.id === kraId ? { ...kra, progress } : kra) }
          : a
        )}
      : m
    ));
    await fetch(`/api/kr-assignments/${kraId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    });
  }

  async function updateKRTarget(kraId: string, assignmentId: string, memberId: string, target: number | null) {
    setMembers((prev) => prev.map((m) => m.id === memberId
      ? { ...m, assignments: m.assignments.map((a) => a.id === assignmentId
          ? { ...a, krAssignments: a.krAssignments.map((kra) => kra.id === kraId ? { ...kra, target } : kra) }
          : a
        )}
      : m
    ));
    await fetch(`/api/kr-assignments/${kraId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    });
  }

  return (
    <div className="space-y-5">
      {/* Distribusi Excel import/export */}
      <DistribusiExcel leadId={leadId} objectives={objectives} quarterId={quarterId} />

      {/* Progress Excel import */}
      <ProgressExcel leadId={leadId} quarterId={quarterId} />

      {/* Add member */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">➕ Tambah Anggota</p>

        {/* Pick from employee list (if available) */}
        {employees.length > 0 && (
          <div className="flex gap-2">
            <select
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white transition"
              value=""
              onChange={(e) => {
                const emp = employees.find((x) => x.id === e.target.value);
                if (emp) setNewName(emp.name);
              }}
            >
              <option value="">🔍 Pilih dari daftar karyawan...</option>
              {employees
                .filter((e) => !members.some((m) => m.name.toLowerCase() === e.name.toLowerCase()))
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}{e.position ? ` — ${e.position}` : ""}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="flex gap-2">
          <input
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white transition"
            placeholder={employees.length > 0 ? "Atau ketik nama baru..." : "👤 Nama anggota (tidak perlu punya akun)"}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addMember(); }}
          />
          <button
            onClick={addMember}
            disabled={saving || !newName.trim()}
            className="flex items-center gap-2 bg-amber-400 text-gray-900 font-bold text-sm px-5 py-2.5 rounded-xl
              shadow-[0_4px_0_#d97706] hover:shadow-[0_2px_0_#d97706] hover:translate-y-0.5
              active:shadow-[0_1px_0_#d97706] active:translate-y-[3px]
              disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 transition-all duration-75"
          >
            ➕ Tambah
          </button>
        </div>
        {employees.length === 0 && (
          <p className="text-xs text-slate-400">💡 Daftar karyawan kosong. Admin bisa menambahkan di Admin → Karyawan.</p>
        )}
      </div>

      {members.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-slate-600 text-sm font-medium">Belum ada anggota</p>
          <p className="text-slate-400 text-xs mt-1">Tambah nama anggota di atas atau import dari Excel.</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {members.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            objectives={objectives}
            onDelete={deleteMember}
            onAddAssignment={addAssignment}
            onRemoveAssignment={removeAssignment}
            onWeightChange={updateWeight}
            onAddKR={addKR}
            onRemoveKR={removeKR}
            onKRWeightChange={updateKRWeight}
            onKRProgressChange={updateKRProgress}
            onKRTargetChange={updateKRTarget}
          />
        ))}
      </div>
    </div>
  );
}
