export type Columns = {t: number[]; x: number[]; y: number[]};
export type Grit = {t: number[]; zone: number[]};
type Range = {mean: number; lower: number; upper: number};

export type SimData = {
  meta: {start: string; hours: number; seed: number; areaSize: number; cellSize: number; zoneSize: number;
    gritHours: number; targeted: string; baseline: string; params: Record<string, number>;
    map: {file: string; attribution: string; retrieved: string}; weatherSource: string};
  weather: {temp: number[]; factor: number[]};
  cells: {id: number[]; x: number[]; y: number[]; perHour: number[]; zone: number[]; route: number[]};
  zones: {id: number[]; x: number[]; y: number[]};
  routes: {name: string; x: number[]; y: number[]}[];
  rhythm: number[];
  posterior: number[];
  grit: {targeted: Grit; baseline: Grit};
  falls: Columns & {captured: number[]; extra: number[]};
  prevented: Columns;
  detections: Columns;
  expected: Record<string, number[]>;
  realized: Record<string, number[]>;
  slipperiness: Record<string, number[]>;
  monteCarlo: null | {seeds: number; meanFalls: Record<string, number>; preventedVsRotation: Range; preventedVsBusiest: Range};
};
