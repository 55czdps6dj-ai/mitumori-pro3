// @ts-nocheck
'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  DEFAULT_VEHICLE_PRICES,
  buildJudgmentResult,
  type VehiclePriceTable,
} from './store/vehicleJudgment';

// ==============================
// 型定義
// ==============================

export interface LaborItem {
  id: string;
  role: string;
  type: 'allDay' | 'hourly' | string;
  staffCount: number;
  unitPrice: number;
  hours: number;
}

export interface WorkCondition {
  id: string;
  label: string;
  value: '当社' | 'お客様' | 'なし';
}

// ==============================
// 定数
// ==============================

const INITIAL_PRICES = {
  平日: { vehicle: 34500, worker: 20000 },
  休日: { vehicle: 44500, worker: 24000 },
  繁忙期平日: { vehicle: 62500, worker: 30000 },
  繁忙期休日: { vehicle: 80500, worker: 36000 },
};

const INITIAL_WORK_CONDITIONS: WorkCondition[] = [
  { id: 'wc1', label: '荷造り', value: 'お客様' },
  { id: 'wc2', label: '荷解き', value: 'お客様' },
  { id: 'wc3', label: 'エアコン取外', value: 'なし' },
  { id: 'wc4', label: 'エアコン取付', value: 'なし' },
  { id: 'wc5', label: '洗濯機接続', value: 'お客様' },
  { id: 'wc6', label: 'ピアノ', value: 'なし' },
];

const initialCustomer = {
  name: '',
  moveDate: '',
  moveDate2: '',
  moveTime: '午前',
  moveTime2: '',
  phone: '',
  fromAddress: '',
  toAddress: '',
  receivedBy: '',
  estimator: '京王 太郎',
  staffName: '',
  hasElevatorFrom: true,
  hasElevatorTo: false,
  floorFrom: '',
  floorTo: '',
  notes: '',
};

const initialMaterials = [
  {
    id: 'm1',
    name: 'ダンボールA',
    quantity: 0,
    price: 200,
    unitPrice: 200,
    step: 5,
  },
  {
    id: 'm2',
    name: 'ダンボールB',
    quantity: 0,
    price: 150,
    unitPrice: 150,
    step: 5,
  },
  {
    id: 'm3',
    name: 'クレープ紙',
    quantity: 0,
    price: 500,
    unitPrice: 500,
    step: 1,
  },
  {
    id: 'm4',
    name: 'クラフトテープ',
    quantity: 0,
    price: 300,
    unitPrice: 300,
    step: 1,
  },
  {
    id: 'm5',
    name: 'ハンガーBOX',
    quantity: 0,
    price: 0,
    unitPrice: 0,
    step: 1,
  },
];

// ==============================
// ストア
// ==============================

export const useEstimateStore = create(
  persist(
    (set, get) => {
      const calculateAll = (state: any) => {
        const multiplier =
          state.dateCategory === '繁忙期休日'
            ? 1.5
            : state.dateCategory === '繁忙期平日'
            ? 1.3
            : state.dateCategory === '休日'
            ? 1.2
            : 1.0;

        const transportTotal = (state.trucks || []).reduce(
          (sum: number, t: any) => {
            const lineBase =
              (Number(t.price || 0) +
                Number(t.distance || 0) * Number(t.distanceRate || 0) +
                Number(t.hours || 0) * Number(t.hourRate || 0)) *
              Number(t.quantity || 0);
            return sum + Math.round(lineBase * multiplier);
          },
          0
        );

        const laborTotal = (state.labors || []).reduce(
          (sum: number, l: any) => {
            const base = Number(l.unitPrice || 0) * Number(l.staffCount || 0);
            const lineBase =
              l.type === 'hourly' ? base * Number(l.hours || 1) : base;
            return sum + Math.round(lineBase * multiplier);
          },
          0
        );

        const serviceTotal = (state.services || []).reduce(
          (sum: number, s: any) =>
            sum + Number(s.price || 0) * Number(s.quantity || 1),
          0
        );

        const baseForDiscount = transportTotal + laborTotal;
        const rateDiscountAmount = Math.round(
          baseForDiscount * (state.discountRate / 100)
        );
        const fixedDiscountAmount = (state.fixedDiscounts || []).reduce(
          (sum: number, d: any) => sum + Number(d.price || 0),
          0
        );
        const subtotal =
          baseForDiscount -
          rateDiscountAmount +
          serviceTotal -
          fixedDiscountAmount;

        return {
          transportTotal,
          laborTotal,
          rateDiscountAmount,
          serviceTotal,
          fixedDiscountAmount,
          subtotal: Math.max(0, subtotal),
          currentMultiplier: multiplier,
          totalDiscount: rateDiscountAmount + fixedDiscountAmount,
        };
      };

      return {
        // 👤 顧客情報
        customer: initialCustomer,
        setCustomer: (data: any) =>
          set((s: any) => ({ customer: { ...s.customer, ...data } })),
        updateCustomer: (data: any) =>
          set((s: any) => ({ customer: { ...s.customer, ...data } })),

        // 📦 資材
        materials: initialMaterials,
        updateMaterial: (id: string, q: number) =>
          set((s: any) => {
            const newMaterials = s.materials.map((m: any) =>
              m.id === id ? { ...m, quantity: Math.max(0, q) } : m
            );
            return {
              materials: newMaterials,
              costs: calculateAll({ ...s, materials: newMaterials }),
            };
          }),
        updateMaterialQty: (id: string, q: number) =>
          set((s: any) => {
            const newMaterials = s.materials.map((m: any) =>
              m.id === id ? { ...m, quantity: Math.max(0, q) } : m
            );
            return {
              materials: newMaterials,
              costs: calculateAll({ ...s, materials: newMaterials }),
            };
          }),
        setMaterials: (mats: any[]) => set({ materials: mats }),

        // 📅 日程区分
        dateCategory: '平日',
        setDateCategory: (val: string) =>
          set((s: any) => ({
            dateCategory: val,
            costs: calculateAll({ ...s, dateCategory: val }),
          })),

        // 🏠 部屋・家財
        rooms: [
          { id: '1', name: 'LDK' },
          { id: '2', name: '寝室1' },
          { id: '3', name: '寝室2' },
          { id: '4', name: 'キッチン' },
          { id: '5', name: 'その他' },
        ],
        currentRoomId: '1',
        setCurrentRoom: (id: string) => set({ currentRoomId: id }),
        addRoom: (name: string) =>
          set((s: any) => ({
            rooms: [...s.rooms, { id: Date.now().toString(), name }],
          })),
        removeRoom: (id: string) =>
          set((s: any) => {
            const newRooms = s.rooms.filter((r: any) => r.id !== id);
            const newItems = s.items.filter((i: any) => i.roomId !== id);
            return {
              rooms: newRooms,
              items: newItems,
              currentRoomId:
                s.currentRoomId === id
                  ? newRooms[0]?.id || ''
                  : s.currentRoomId,
            };
          }),

        items: [],
        totalPt: 0,

        addItem: (item: any) =>
          set((s: any) => {
            const roomId = s.currentRoomId;
            const existingIndex = s.items.findIndex(
              (i: any) => i.name === item.name && i.room === item.room
            );
            let newItems = [...s.items];
            if (existingIndex > -1) {
              newItems[existingIndex] = {
                ...newItems[existingIndex],
                quantity: newItems[existingIndex].quantity + 1,
              };
            } else {
              newItems.push({
                ...item,
                roomId,
                quantity: 1,
              });
            }
            return {
              items: newItems,
              totalPt: newItems.reduce(
                (sum, i) => sum + (i.pt || 0) * i.quantity,
                0
              ),
            };
          }),

        updateItemQuantity: (idOrName: string, q: number) =>
          set((s: any) => {
            let found = false;
            let newItems = s.items.map((i: any) => {
              if (i.id === idOrName || i.name === idOrName) {
                found = true;
                return { ...i, quantity: Math.max(0, q) };
              }
              return i;
            });
            if (!found && q > 0) {
              newItems.push({
                id:
                  Date.now().toString() +
                  Math.random().toString(36).substr(2, 5),
                name: idOrName,
                quantity: q,
                pt: 0,
                roomId: s.currentRoomId || '1',
              });
            }
            const filtered = newItems.filter((i: any) => i.quantity > 0);
            return {
              items: filtered,
              totalPt: filtered.reduce(
                (sum, i) => sum + (i.pt || 0) * i.quantity,
                0
              ),
            };
          }),

        updateQuantity: (id: string, q: number) =>
          get().updateItemQuantity(id, q),

        // 🚚 車両
        trucks: [],
        setTrucks: (trucks: any[]) =>
          set((s: any) => ({ trucks, costs: calculateAll({ ...s, trucks }) })),
        addTruck: (data: any = {}) =>
          set((s: any) => {
            const defaultPrice =
              INITIAL_PRICES[s.dateCategory]?.vehicle || 34500;
            const newTrucks = [
              ...s.trucks,
              {
                id: Date.now().toString(),
                type: '2t',
                quantity: 1,
                price: defaultPrice,
                distance: 0,
                distanceRate: 0,
                hours: 0,
                hourRate: 0,
                ...data,
              },
            ];
            return {
              trucks: newTrucks,
              costs: calculateAll({ ...s, trucks: newTrucks }),
            };
          }),
        updateTruck: (id: string, data: any) =>
          set((s: any) => {
            const newTrucks = s.trucks.map((t: any) =>
              t.id === id ? { ...t, ...data } : t
            );
            return {
              trucks: newTrucks,
              costs: calculateAll({ ...s, trucks: newTrucks }),
            };
          }),
        removeTruck: (id: string) =>
          set((s: any) => {
            const newTrucks = s.trucks.filter((t: any) => t.id !== id);
            return {
              trucks: newTrucks,
              costs: calculateAll({ ...s, trucks: newTrucks }),
            };
          }),

        // 👤 作業員
        labors: [],
        setLabors: (labors: any[]) =>
          set((s: any) => ({ labors, costs: calculateAll({ ...s, labors }) })),
        addLaborItem: (data: any) =>
          set((s: any) => {
            const defaultPrice =
              INITIAL_PRICES[s.dateCategory]?.worker || 20000;
            const newItem = {
              id: data.id || Date.now().toString(),
              role: data.role || '作業員',
              type: data.type || 'allDay',
              staffCount: data.staffCount || 1,
              unitPrice: data.unitPrice || defaultPrice,
              hours: data.hours || 8,
            };
            const newLabors = [...s.labors, newItem];
            return {
              labors: newLabors,
              costs: calculateAll({ ...s, labors: newLabors }),
            };
          }),
        updateLaborItem: (id: string, field: string, value: any) =>
          set((s: any) => {
            const newLabors = s.labors.map((l: any) =>
              l.id === id ? { ...l, [field]: value } : l
            );
            return {
              labors: newLabors,
              costs: calculateAll({ ...s, labors: newLabors }),
            };
          }),
        removeLaborItem: (id: string) =>
          set((s: any) => {
            const newLabors = s.labors.filter((l: any) => l.id !== id);
            return {
              labors: newLabors,
              costs: calculateAll({ ...s, labors: newLabors }),
            };
          }),

        // ✨ 付帯サービス
        services: [],
        setServices: (services: any[]) =>
          set((s: any) => ({
            services,
            costs: calculateAll({ ...s, services }),
          })),
        addService: (name: string) =>
          set((s: any) => {
            const newServices = [
              ...s.services,
              { id: Date.now().toString(), name, price: 0, quantity: 1 },
            ];
            return {
              services: newServices,
              costs: calculateAll({ ...s, services: newServices }),
            };
          }),
        updateService: (id: string, data: any) =>
          set((s: any) => {
            const newServices = s.services.map((sv: any) =>
              sv.id === id ? { ...sv, ...data } : sv
            );
            return {
              services: newServices,
              costs: calculateAll({ ...s, services: newServices }),
            };
          }),
        removeService: (id: string) =>
          set((s: any) => {
            const newServices = s.services.filter((sv: any) => sv.id !== id);
            return {
              services: newServices,
              costs: calculateAll({ ...s, services: newServices }),
            };
          }),

        // 🉐 割引
        discountRate: 0,
        setDiscountRate: (rate: number) =>
          set((s: any) => ({
            discountRate: rate,
            costs: calculateAll({ ...s, discountRate: rate }),
          })),
        fixedDiscounts: [],
        setFixedDiscounts: (fixedDiscounts: any[]) =>
          set((s: any) => ({
            fixedDiscounts,
            costs: calculateAll({ ...s, fixedDiscounts }),
          })),
        addFixedDiscount: (data: string | { name: string; price?: number }) =>
          set((s: any) => {
            const name =
              typeof data === 'string' ? data : data.name || '値引き';
            const price =
              typeof data === 'string' ? 0 : Number(data.price || 0);
            const newDiscounts = [
              ...s.fixedDiscounts,
              { id: Date.now().toString(), name, price },
            ];
            return {
              fixedDiscounts: newDiscounts,
              costs: calculateAll({ ...s, fixedDiscounts: newDiscounts }),
            };
          }),
        updateFixedDiscount: (id: string, data: any) =>
          set((s: any) => {
            const newDiscounts = s.fixedDiscounts.map((d: any) =>
              d.id === id
                ? { ...d, ...data, price: Number(data.price ?? d.price) }
                : d
            );
            return {
              fixedDiscounts: newDiscounts,
              costs: calculateAll({ ...s, fixedDiscounts: newDiscounts }),
            };
          }),
        removeFixedDiscount: (id: string) =>
          set((s: any) => {
            const newDiscounts = s.fixedDiscounts.filter(
              (d: any) => d.id !== id
            );
            return {
              fixedDiscounts: newDiscounts,
              costs: calculateAll({ ...s, fixedDiscounts: newDiscounts }),
            };
          }),

        // 🔧 作業区分
        workConditions: INITIAL_WORK_CONDITIONS,
        updateWorkCondition: (id: string, value: '当社' | 'お客様' | 'なし') =>
          set((s: any) => ({
            workConditions: s.workConditions.map((wc: WorkCondition) =>
              wc.id === id ? { ...wc, value } : wc
            ),
          })),

        // 🚛 車両判定シミュレーター
        vehiclePriceTable: DEFAULT_VEHICLE_PRICES,
        setVehiclePriceTable: (table: VehiclePriceTable) =>
          set({ vehiclePriceTable: table }),
        applySimulatorResult: (totalPt: number, dateCategory?: string) =>
          set((s: any) => {
            const category = dateCategory || s.dateCategory;
            const result = buildJudgmentResult(totalPt, s.vehiclePriceTable);
            if (!result.vehicleKey) return {};
            const PRICE_MASTER: Record<string, Record<string, number>> = {
              平日: { '1t': 31000, '2t': 34500, '3t': 36500, '4t': 40500 },
              休日: { '1t': 40000, '2t': 44500, '3t': 47500, '4t': 52500 },
              繁忙期平日: {
                '1t': 59000,
                '2t': 62500,
                '3t': 64500,
                '4t': 68500,
              },
              繁忙期休日: {
                '1t': 76000,
                '2t': 80500,
                '3t': 83500,
                '4t': 88500,
              },
            };
            const vehiclePrice =
              PRICE_MASTER[category]?.[result.truckType] || 34500;
            const newTrucks = Array.from(
              { length: result.quantity },
              (_, i) => ({
                id: `simulator-${Date.now()}-${i}`,
                type: result.truckType,
                quantity: 1,
                price: vehiclePrice,
                distance: 0,
                distanceRate: 0,
                hours: 0,
                hourRate: 0,
              })
            );
            return {
              trucks: newTrucks,
              costs: calculateAll({ ...s, trucks: newTrucks }),
            };
          }),

        // ⚙️ プリセット・計算結果
        SERVICE_PRESETS: [
          'エアコン取付',
          'エアコン取外',
          '洗濯機設置',
          'ピアノ運送',
          '高速代',
          '駐車場代',
          '保険料',
          'カスタム',
        ],
        costs: {
          transportTotal: 0,
          laborTotal: 0,
          rateDiscountAmount: 0,
          serviceTotal: 0,
          fixedDiscountAmount: 0,
          subtotal: 0,
          totalDiscount: 0,
        },

        // ⚙️ システムアクション
        resetForLoad: () =>
          set({
            customer: initialCustomer,
            items: [],
            trucks: [],
            labors: [],
            services: [],
            materials: initialMaterials,
            fixedDiscounts: [],
            discountRate: 0,
            totalPt: 0,
            dateCategory: '平日',
            workConditions: INITIAL_WORK_CONDITIONS,
          }),

        clearEstimate: () => {
          if (confirm('入力したすべてのデータを削除して初期化しますか？')) {
            localStorage.removeItem('estimate-storage');
            window.location.reload();
          }
        },

        saveEstimate: async () => {
          console.log('Final Snapshot:', get());
          alert('一時保存しました（ブラウザ内）');
        },
      };
    },
    {
      name: 'estimate-storage',
      storage: createJSONStorage(() => localStorage),
      // ✅ items と totalPt は persist しない（DBから復元するため）
      partialize: (state: any) => {
        const { items, totalPt, ...rest } = state;
        return rest;
      },
    }
  )
);
