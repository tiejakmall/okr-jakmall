import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    const userCount = await prisma.user.count();

    // Member link debug info
    let memberDebug = null;
    if (session?.user?.id) {
      const userId = session.user.id;
      const teamMember = await prisma.teamMember.findUnique({
        where: { userId },
        include: { lead: { select: { name: true, division: true } } },
      });
      const allMembers = await prisma.user.findMany({
        where: { role: "MEMBER" },
        select: { id: true, name: true, teamMembership: { select: { id: true, name: true } } },
      });
      const activeQuarter = await prisma.quarter.findFirst({ where: { isActive: true }, select: { id: true, name: true } });
      const assignmentCount = teamMember && activeQuarter
        ? await prisma.objectiveAssignment.count({ where: { memberId: teamMember.id, objective: { quarterId: activeQuarter.id } } })
        : null;

      memberDebug = {
        sessionUserId: userId,
        sessionRole: session.user.role,
        linkedTeamMember: teamMember ? { id: teamMember.id, name: teamMember.name, lead: teamMember.lead } : null,
        activeQuarter,
        assignmentsInActiveQuarter: assignmentCount,
        allMemberLinks: allMembers.map(u => ({ userId: u.id, name: u.name, linked: u.teamMembership?.name ?? null })),
      };
    }

    return Response.json({
      ok: true,
      userCount,
      session: session ? { id: session.user.id, email: session.user.email, role: session.user.role } : null,
      memberDebug,
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
