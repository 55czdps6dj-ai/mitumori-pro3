// ==============================
// 🚛 トラック
// ==============================

export type TruckMaster = {
  id: string;
  name: string;
  baseFee: number;
  perKm: number;
  perHour: number;
};

export type SelectedTruck = {
  id: string;
  truckId: string;
  quantity: number;
  distanceKm?: number;
  workHours?: number;
};

// ==============================
// 👷 人件費
// ==============================

export type LaborRole =
  | 'departure'
  | 'arrival'
  | 'fullDay'
  | 'packing'
  | 'unpacking';

export type LaborUnit = {
  id: string;
  role: LaborRole;
  workers: number;
  hours: number;
  unitPrice: number;
};

// ==============================
// 🧰 付帯サービス
// ==============================

export type ServiceItem = {
  id: string;
  name: string;
  quantity?: number;
  unitPrice?: number;
  flatFee?: number;
};

// ==============================
// 💰 その他費用
// ==============================

export type OtherCost = {
  id: string;
  description: string;
  amount: number;
};

// ==============================
// 🧾 見積全体
// ==============================

export type EstimateData = {
  trucks: SelectedTruck[];
  labor: LaborUnit[];
  services: ServiceItem[];
  otherCosts: OtherCost[];
};
