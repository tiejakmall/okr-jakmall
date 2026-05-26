type KR = {
  id: string;
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

type KRAssignment = {
  keyResultId: string;
  weight: number;
};

type Assignment = {
  weight: number;
  objectiveId: string;
  objective?: ObjWithKRs;
  krAssignments?: KRAssignment[];
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

// Hitung achievement objective pakai KR weights khusus per member
function calcObjectiveAchievementForMember(obj: ObjWithKRs, krAssignments: KRAssignment[]): number {
  if (krAssignments.length === 0) return calcObjectiveAchievement(obj);
  const totalWeight = krAssignments.reduce((s: number, kra: KRAssignment) => s + kra.weight, 0);
  if (totalWeight === 0) return calcObjectiveAchievement(obj);
  return krAssignments.reduce((s: number, kra: KRAssignment) => {
    const kr = obj.keyResults.find((k) => k.id === kra.keyResultId);
    if (!kr) return s;
    return s + (calcKRAchievement(kr) * kra.weight) / totalWeight;
  }, 0);
}

// Hitung pencapaian member berdasarkan assignment ke objectives + KR weights per member
export function calcMemberAchievement(assignments: Assignment[], objectives: ObjWithKRs[]): number {
  if (assignments.length === 0) return 0;
  const objMap = new Map(objectives.map((o) => [o.id, o]));
  const totalWeight = assignments.reduce((s: number, a: Assignment) => s + a.weight, 0);
  if (totalWeight === 0) return 0;
  return assignments.reduce((s: number, a: Assignment) => {
    const obj = a.objective ?? objMap.get(a.objectiveId);
    if (!obj) return s;
    const objAchievement =
      a.krAssignments && a.krAssignments.length > 0
        ? calcObjectiveAchievementForMember(obj, a.krAssignments)
        : calcObjectiveAchievement(obj);
    return s + (objAchievement * a.weight) / totalWeight;
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
