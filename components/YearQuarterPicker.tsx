"use client";

import { useState, useEffect } from "react";
import { groupByYear } from "@/lib/quarter-group";

type Quarter = { id: string; name: string; year: number; quarter: number; isActive: boolean };

type Props = {
  quarters: Quarter[];
  value: string;
  onChange: (quarterId: string) => void;
};

export default function YearQuarterPicker({ quarters, value, onChange }: Props) {
  const grouped = groupByYear(quarters);
  const years = grouped.map((g) => g.year);

  // Derive the year of the currently selected quarter
  const selectedQ = quarters.find((q) => q.id === value);
  const [selectedYear, setSelectedYear] = useState<number>(
    selectedQ?.year ?? years[0] ?? new Date().getFullYear()
  );

  // If the value changes externally (e.g. parent sets a new quarter), sync the year
  useEffect(() => {
    const q = quarters.find((q) => q.id === value);
    if (q && q.year !== selectedYear) setSelectedYear(q.year);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const yearQuarters =
    grouped.find((g) => g.year === selectedYear)?.quarters ?? [];

  function handleYearChange(year: number) {
    setSelectedYear(year);
    // Auto-select active quarter in new year, else first quarter
    const qs = grouped.find((g) => g.year === year)?.quarters ?? [];
    const target = qs.find((q) => q.isActive) ?? qs[0];
    if (target) onChange(target.id);
  }

  const yearBtn = (active: boolean) =>
    `px-3 py-1 rounded-lg text-xs font-bold transition-all duration-75 ` +
    (active
      ? "bg-slate-700 text-white shadow-[0_2px_0_#1e293b]"
      : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 shadow-[0_2px_0_#e2e8f0] hover:shadow-[0_1px_0_#e2e8f0] hover:translate-y-px");

  const qBtn = (active: boolean, isCurrentActive: boolean) =>
    `px-3 py-1 rounded-lg text-xs font-bold transition-all duration-75 ` +
    (active
      ? "bg-amber-400 text-gray-900 shadow-[0_2px_0_#d97706]"
      : isCurrentActive
      ? "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 shadow-[0_2px_0_#fde68a] hover:shadow-[0_1px_0_#fde68a] hover:translate-y-px"
      : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 shadow-[0_2px_0_#e2e8f0] hover:shadow-[0_1px_0_#e2e8f0] hover:translate-y-px");

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Year pills */}
      <div className="flex gap-1.5">
        {years.map((y) => (
          <button key={y} onClick={() => handleYearChange(y)} className={yearBtn(y === selectedYear)}>
            {y}
          </button>
        ))}
      </div>

      {/* Divider */}
      {yearQuarters.length > 0 && (
        <span className="text-slate-300 text-sm select-none">›</span>
      )}

      {/* Quarter pills */}
      <div className="flex gap-1.5">
        {yearQuarters.map((q) => (
          <button
            key={q.id}
            onClick={() => onChange(q.id)}
            className={qBtn(q.id === value, q.isActive)}
          >
            Q{q.quarter}{q.isActive ? " ✅" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
