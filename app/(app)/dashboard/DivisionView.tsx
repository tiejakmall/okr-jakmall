"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MemberContrib = { memberId: string; memberName: string; progress: number };
type KRData = {
  id: string; title: string; target: number; unit: string; weight: number;
  teamProgress: number; leadProgress: number | null; achievement: number;
  memberContributions: MemberContrib[];
};
type ObjData = {
  id: string; title: string; weight: number; achievement: number; keyResults: KRData[];
};
type MemberData = { id: string; name: string; achievement: number };
type DivisionData = {
  objectives: ObjData[]; members: MemberData[]; divisionAchievement: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function achClass(v: number) {
  return v >= 100 ? "bg-green-100 text-green-700" : v >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600";
}
function achEmoji(v: number) { return v >= 100 ? "🏆" : v >= 70 ? "🔥" : "📉"; }
function barColor(v: number) { return v >= 100 ? "#22c55e" : v >= 70 ? "#f59e0b" : "#f87171"; }

function PctBadge({ value }: { value: number }) {
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${achClass(value)}`}>
      {achEmoji(value)} {value.toFixed(1)}%
    </span>
  );
}

function ProgressBar({ value, size = "md" }: { value: number; size?: "xs" | "sm" | "md" }) {
  const h = size === "xs" ? "h-1" : size === "sm" ? "h-1.5" : "h-2";
  const bg = value >= 100 ? "bg-green-500" : value >= 70 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className={`${h} bg-slate-100 rounded-full overflow-hidden`}>
      <div className={`${h} ${bg} rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

// ─── KR Chart ─────────────────────────────────────────────────────────────────

function KRChart({ keyResults }: { keyResults: KRData[] }) {
  if (keyResults.length === 0) return null;
  return (
    <div className="mt-4 space-y-2.5">
      {keyResults.map((kr) => (
        <div key={kr.id}>
          <div className="flex items-start justify-between gap-3 mb-1">
            <span className="text-xs text-slate-600 leading-snug">{kr.title}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${achClass(kr.achievement)}`}>
              {kr.achievement.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${Math.min(kr.achievement, 100)}%`, backgroundColor: barColor(kr.achievement) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Objective section ────────────────────────────────────────────────────────

function ObjectiveSection({ obj, index }: { obj: ObjData; index: number }) {
  const [open, setOpen] = useState(true);
  const [showContrib, setShowContrib] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Objective header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg flex-shrink-0">🎯</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-600 mb-0.5">Objective #{index + 1}</p>
            <h3 className="font-bold text-slate-800 text-sm leading-snug">{obj.title}</h3>
            <span className="text-xs text-slate-400">⚖️ Bobot {obj.weight}%</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <PctBadge value={obj.achievement} />
          <span className="text-slate-300 group-hover:text-slate-500 transition-colors">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </button>

      {open && <>
      <div className="px-5 py-2 border-t border-slate-100">
        <ProgressBar value={obj.achievement} />
      </div>

      <div className="p-5 space-y-5">
        {/* KR Table */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">🔑 Key Results</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-slate-400">Key Result</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-slate-400">Target</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-slate-400">Satuan</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-slate-400">Bobot</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-slate-400">Progress</th>
                  <th className="text-right py-2 pl-2 text-xs font-semibold text-slate-400">Pencapaian</th>
                </tr>
              </thead>
              <tbody>
                {obj.keyResults.map((kr) => {
                  const progress = kr.teamProgress + (kr.leadProgress ?? 0);
                  return (
                    <tr key={kr.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-slate-700 max-w-[180px]">
                        <span className="truncate block">{kr.title}</span>
                        {kr.leadProgress != null && kr.leadProgress > 0 && (
                          <span className="text-xs text-blue-500">➕ lead: {kr.leadProgress}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-600 tabular-nums">{kr.target}</td>
                      <td className="py-2.5 px-2 text-right text-slate-400">{kr.unit}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-slate-600">{kr.weight}%</td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-slate-700">
                        {progress} / {kr.target}
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${achClass(kr.achievement)}`}>
                          {kr.achievement.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* KR Chart */}
        <KRChart keyResults={obj.keyResults} />

        {/* Member contribution toggle */}
        {obj.keyResults.some((kr) => kr.memberContributions.length > 0) && (
          <div>
            <button
              onClick={() => setShowContrib((v) => !v)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 font-semibold transition"
            >
              👥 Kontribusi Anggota {showContrib ? "▲" : "▼"}
            </button>

            {showContrib && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 pr-3 text-xs font-semibold text-slate-400">Anggota</th>
                      {obj.keyResults.filter((kr) => kr.memberContributions.length > 0).map((kr) => (
                        <th key={kr.id} className="text-right py-2 px-2 text-xs font-semibold text-slate-400 max-w-[90px]">
                          <span className="truncate block">{kr.title.length > 12 ? kr.title.slice(0, 12) + "…" : kr.title}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Collect unique members */}
                    {Array.from(
                      new Map(
                        obj.keyResults.flatMap((kr) =>
                          kr.memberContributions.map((c) => [c.memberId, { id: c.memberId, name: c.memberName }])
                        )
                      ).values()
                    ).map((member) => (
                      <tr key={member.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-2 pr-3 font-medium text-slate-700 text-xs">{member.name}</td>
                        {obj.keyResults
                          .filter((kr) => kr.memberContributions.length > 0)
                          .map((kr) => {
                            const contrib = kr.memberContributions.find((c) => c.memberId === member.id);
                            const pct = kr.target > 0 && contrib
                              ? Math.min((contrib.progress / kr.target) * 100, 100)
                              : 0;
                            return (
                              <td key={kr.id} className="py-2 px-2 text-right text-xs">
                                {contrib ? (
                                  <div>
                                    <span className="font-semibold text-slate-700 tabular-nums">
                                      {contrib.progress}/{kr.target} {kr.unit}
                                    </span>
                                    <span className={`ml-1 font-semibold ${pct >= 100 ? "text-green-600" : pct >= 70 ? "text-amber-500" : "text-red-500"}`}>({pct.toFixed(0)}%)</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      </>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Props = {
  quarters: { id: string; name: string; isActive: boolean }[];
  leadId: string;
  divisionName: string;
  defaultQuarterId?: string;
};

export default function DivisionView({ quarters, leadId, divisionName, defaultQuarterId }: Props) {
  const activeQ = quarters.find((q) => q.isActive) ?? quarters[0];
  const [selectedQ, setSelectedQ] = useState(defaultQuarterId ?? activeQ?.id ?? "");
  const [data, setData] = useState<DivisionData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedQ) return;
    setLoading(true);
    fetch(`/api/dashboard/division?quarterId=${selectedQ}&leadId=${leadId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedQ, leadId]);

  const achBg = !data ? "" : data.divisionAchievement >= 100
    ? "bg-green-50 border-green-200 text-green-800"
    : data.divisionAchievement >= 70
    ? "bg-amber-50 border-amber-200 text-amber-800"
    : "bg-red-50 border-red-200 text-red-700";

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">📊 {divisionName}</h1>
          {/* Quarter selector */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-400">⏱️ Quarter:</span>
            <select
              value={selectedQ}
              onChange={(e) => setSelectedQ(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white
                shadow-[0_2px_0_#e2e8f0] hover:shadow-[0_1px_0_#e2e8f0] hover:translate-y-px transition-all duration-75"
            >
              {quarters.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}{q.isActive ? " ✅" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap print:hidden">
          {data && (
            <div className={`border rounded-2xl px-6 py-3 text-center ${achBg}`}>
              <p className="text-xs font-semibold mb-0.5">🏆 Pencapaian Divisi</p>
              <p className="text-3xl font-bold leading-tight">{data.divisionAchievement.toFixed(1)}%</p>
            </div>
          )}
          <div className="flex gap-2">
            {selectedQ && (
              <button
                onClick={() => window.open(`/api/dashboard/division/print?leadId=${leadId}&quarterId=${selectedQ}&divisionName=${encodeURIComponent(divisionName)}`)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-[0_2px_0_#e2e8f0] hover:shadow-[0_1px_0_#e2e8f0] hover:translate-y-px transition-all duration-75"
              >🖨️ Print PDF</button>
            )}
            {selectedQ && (
              <a
                href={`/api/dashboard/division/export?leadId=${leadId}&quarterId=${selectedQ}&divisionName=${encodeURIComponent(divisionName)}`}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-[0_2px_0_#e2e8f0] hover:shadow-[0_1px_0_#e2e8f0] hover:translate-y-px transition-all duration-75"
              >📊 Excel</a>
            )}
          </div>
        </div>
        {data && (
          <div className={`border rounded-2xl px-6 py-3 text-center hidden print:block ${achBg}`}>
            <p className="text-xs font-semibold mb-0.5">🏆 Pencapaian Divisi</p>
            <p className="text-3xl font-bold leading-tight">{data.divisionAchievement.toFixed(1)}%</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <span className="text-2xl animate-spin mr-3">⏳</span> Memuat data...
        </div>
      )}

      {!loading && data && quarters.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-700 text-sm">
          ⚠️ Belum ada quarter. Tambahkan di Admin → Quarter.
        </div>
      )}

      {!loading && data && data.objectives.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-slate-500 text-sm">Belum ada objective untuk quarter ini.</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Objective cards */}
          <div className="space-y-5">
            {data.objectives.map((obj, i) => (
              <ObjectiveSection key={obj.id} obj={obj} index={i} />
            ))}
          </div>

          {/* Member ranking */}
          {data.members.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm">🏅 Ranking Pencapaian Anggota</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {[...data.members]
                  .sort((a, b) => b.achievement - a.achievement)
                  .map((m, idx) => {
                    const initials = m.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                    const medals = ["🥇", "🥈", "🥉"];
                    return (
                      <div key={m.id} className="flex items-center gap-4 px-5 py-3">
                        <span className="text-lg w-6 text-center">{medals[idx] ?? `${idx + 1}`}</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs flex-shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{m.name}</p>
                          <div className="mt-1">
                            <ProgressBar value={m.achievement} size="xs" />
                          </div>
                        </div>
                        <PctBadge value={m.achievement} />
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
