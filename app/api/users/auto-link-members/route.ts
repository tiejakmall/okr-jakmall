import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.user.findMany({ where: { role: "MEMBER" } });
  const teamMembers = await prisma.teamMember.findMany({
    include: { lead: { select: { division: true } } },
  });

  const linked: string[] = [];
  const skipped: string[] = [];
  const noMatch: string[] = [];

  for (const user of members) {
    if (!user.division) {
      skipped.push(`${user.name}: tidak ada divisi`);
      continue;
    }

    const alreadyLinked = teamMembers.find((tm) => tm.userId === user.id);
    if (alreadyLinked) {
      skipped.push(`${user.name}: sudah ter-link ke "${alreadyLinked.name}"`);
      continue;
    }

    const pool = teamMembers.filter(
      (tm) => tm.userId === null && tm.lead.division?.toLowerCase() === user.division!.toLowerCase()
    );

    const nameLower = user.name.toLowerCase();
    const match =
      pool.find((tm) => tm.name.toLowerCase() === nameLower) ??
      (() => { const c = pool.filter((tm) => tm.name.toLowerCase().startsWith(nameLower)); return c.length === 1 ? c[0] : undefined; })() ??
      (() => { const c = pool.filter((tm) => nameLower.startsWith(tm.name.toLowerCase())); return c.length === 1 ? c[0] : undefined; })();

    if (match) {
      await prisma.teamMember.update({ where: { id: match.id }, data: { userId: user.id } });
      const idx = teamMembers.findIndex((tm) => tm.id === match.id);
      if (idx !== -1) teamMembers[idx] = { ...teamMembers[idx], userId: user.id };
      linked.push(`${user.name} ↔ ${match.name} (${user.division})`);
    } else {
      noMatch.push(`${user.name} (${user.division}): tidak ada anggota cocok`);
    }
  }

  return NextResponse.json({ linked: linked.length, skipped: skipped.length, noMatch: noMatch.length, log: linked.map(l => `✅ ${l}`).concat(noMatch.map(n => `❌ ${n}`)).concat(skipped.map(s => `⏭️ ${s}`)) });
}
