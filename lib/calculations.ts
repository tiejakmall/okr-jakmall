type KR = {
  target: number;
  unit: string;
  weight: number;
  teamProgress: number;
  leadProgress: number | null;
};

type ObjWithKRs = {
  id: string;
  weight: number;
  keyResults: KR[];
};

type Assignment = {
  weight: number;
  objectiveId: string;
  objective?: ObjWithKRs;
};

export function calcKRAchievement(kr: KR): number {
  const progress = kr.leadProgress ?? kr.teamProgress;
  if (kr.target === 0) return 0;
  return Math.min((progress / kr.target) * 100, 100);
}

export function calcObjectiveAchievement(obj: ObjWithKRs): number {
  if (obj.keyResults.length === 0) return 0;
  const totalWeight = obj.keyResults.reduce((s: number, kr: KR) => s + kr.weight, 0);
  if (totalWeight === 0) return 0;
  return obj.keyResults.reduce(
    (s: number, kr: KR) => s + (calcKRAchievement(kr) * kr.weight) / totalWeight,
    0
  );
}

// Hitung pencapaian berdasarkan assignment ke objectives
export function calcMemberAchievement(assignments: Assignment[], objectives: ObjWithKRs[]): number {
  if (assignments.length === 0) return 0;
  const objMap = new Map(objectives.map((o) => [o.id, o]));
  const totalWeight = assignments.reduce((s: number, a: Assignment) => s + a.weight, 0);
  if (totalWeight === 0) return 0;
  return assignments.reduce((s: number, a: Assignment) => {
    const obj = a.objective ?? objMap.get(a.objectiveId);
    if (!obj) return s;
    return s + (calcObjectiveAchievement(obj) * a.weight) / totalWeight;
  }, 0);
}

// Legacy: untuk Member yang punya objectives sendiri
export function calcUserAchievement(objectives: ObjWithKRs[]): number {
  if (objectives.length === 0) return 0;
  const totalWeight = objectives.reduce((s: number, o: ObjWithKRs) => s + o.weight, 0);
  if (totalWeight === 0) return 0;
  return objectives.reduce(
    (s: number, o: ObjWithKRs) => s + (calcObjectiveAchievement(o) * o.weight) / totalWeight,
    0
  );
}
