/**
 * vehicleJudgment.ts
 * 荷物ポイント → 推奨車両の判定ロジック（純粋関数）
 * UIにもストアにも依存しない完全独立モジュール
 */

// ==============================
// 型定義
// ==============================

export type VehicleKey = '2T車' | '2T車L' | '3T車' | '2台口以上';

/**
 * 車両別料金テーブル
 * [0]: 通常料金（時間帯自由）
 * [1]: 時間指定料金
 */
export type VehiclePriceTable = Record<VehicleKey, [number, number]>;

export interface VehicleJudgmentResult {
  vehicleKey: VehicleKey | null;
  label: string;
  normalPrice: number;
  designatedPrice: number;
  totalPt: number;
  truckType: string;
  quantity: number;
}

// ==============================
// 定数
// ==============================

export const VEHICLE_THRESHOLDS: { max: number; key: VehicleKey }[] = [
  { max: 200, key: '2T車' },
  { max: 260, key: '2T車L' },
  { max: 360, key: '3T車' },
  { max: Infinity, key: '2台口以上' },
];

export const DEFAULT_VEHICLE_PRICES: VehiclePriceTable = {
  '2T車': [15000, 18000],
  '2T車L': [20000, 24000],
  '3T車': [30000, 35000],
  '2台口以上': [45000, 52000],
};

export const VEHICLE_KEY_TO_TRUCK_TYPE: Record<VehicleKey, string> = {
  '2T車': '2t',
  '2T車L': '2t',
  '3T車': '3t',
  '2台口以上': '2t',
};

export const VEHICLE_KEY_TO_QUANTITY: Record<VehicleKey, number> = {
  '2T車': 1,
  '2T車L': 1,
  '3T車': 1,
  '2台口以上': 2,
};

export const GAUGE_MAX_PT = 500;

// ==============================
// 純粋関数
// ==============================

export function judgeVehicleKey(totalPt: number): VehicleKey | null {
  if (totalPt <= 0) return null;
  for (const { max, key } of VEHICLE_THRESHOLDS) {
    if (totalPt <= max) return key;
  }
  return '2台口以上';
}

export function buildJudgmentResult(
  totalPt: number,
  priceTable: VehiclePriceTable
): VehicleJudgmentResult {
  const vehicleKey = judgeVehicleKey(totalPt);

  if (vehicleKey === null) {
    return {
      vehicleKey: null,
      label: '---',
      normalPrice: 0,
      designatedPrice: 0,
      totalPt,
      truckType: '2t',
      quantity: 1,
    };
  }

  const [normalPrice, designatedPrice] = priceTable[vehicleKey] ?? [0, 0];

  return {
    vehicleKey,
    label: vehicleKey,
    normalPrice,
    designatedPrice,
    totalPt,
    truckType: VEHICLE_KEY_TO_TRUCK_TYPE[vehicleKey],
    quantity: VEHICLE_KEY_TO_QUANTITY[vehicleKey],
  };
}

export function calcGaugePercent(totalPt: number): number {
  return Math.min((totalPt / GAUGE_MAX_PT) * 100, 100);
}

export interface GaugeZone {
  key: VehicleKey;
  minPt: number;
  maxPt: number;
  label: string;
  color: string;
  textColor: string;
}

export const GAUGE_ZONES: GaugeZone[] = [
  {
    key: '2T車',
    minPt: 1,
    maxPt: 200,
    label: '2T車',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-400',
  },
  {
    key: '2T車L',
    minPt: 201,
    maxPt: 260,
    label: '2T車L',
    color: 'bg-yellow-400',
    textColor: 'text-yellow-300',
  },
  {
    key: '3T車',
    minPt: 261,
    maxPt: 360,
    label: '3T車',
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
  },
  {
    key: '2台口以上',
    minPt: 361,
    maxPt: 500,
    label: '2台口以上',
    color: 'bg-red-600',
    textColor: 'text-red-400',
  },
];

export function getCurrentZone(totalPt: number): GaugeZone | null {
  if (totalPt <= 0) return null;
  return (
    GAUGE_ZONES.find((z) => totalPt >= z.minPt && totalPt <= z.maxPt) ??
    GAUGE_ZONES[GAUGE_ZONES.length - 1]
  );
}
