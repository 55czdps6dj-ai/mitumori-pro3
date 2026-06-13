// @ts-nocheck
'use client';

import React from 'react';
import { useEstimateStore } from '../useEstimateStore';
import { v4 as uuid } from 'uuid';

/**
 * 京王運輸 引越運賃諸料金表（2020年1月10日改定）
 * ※Store側の計算ロジックと整合性をとるための参照用
 */
const PRICE_MASTER = {
  平日: {
    vehicle: { '1t': 31000, '2t': 34500, '3t': 36500, '4t': 40500 },
    worker: 20000,
  },
  休日: {
    vehicle: { '1t': 40000, '2t': 44500, '3t': 47500, '4t': 52500 },
    worker: 24000,
  },
  繁忙期平日: {
    vehicle: { '1t': 59000, '2t': 62500, '3t': 64500, '4t': 68500 },
    worker: 30000,
  },
  繁忙期休日: {
    vehicle: { '1t': 76000, '2t': 80500, '3t': 83500, '4t': 88500 },
    worker: 36000,
  },
};

export default function LaborTab() {
  const store = useEstimateStore();
  const {
    trucks,
    updateTruck,
    removeTruck,
    addTruck,
    labors,
    updateLaborItem,
    removeLaborItem,
    addLaborItem, // 💡 最新の命名に合わせました
    services,
    addService,
    updateService,
    removeService,
    SERVICE_PRESETS,
    dateCategory,
    setDateCategory,
    discountRate,
    setDiscountRate,
    fixedDiscounts,
    addFixedDiscount,
    updateFixedDiscount,
    removeFixedDiscount,
  } = store;

  // 👤 作業員追加
  const handleAddLabor = () => {
    const category = dateCategory || '平日';
    const currentWorkerPrice =
      PRICE_MASTER[category as keyof typeof PRICE_MASTER].worker;
    addLaborItem({
      id: uuid(),
      role: '作業員',
      staffCount: 1,
      unitPrice: currentWorkerPrice,
      type: 'allDay',
      hours: 8,
    });
  };

  // 🚚 車両追加
  const handleAddTruck = () => {
    const category = dateCategory || '平日';
    const master = PRICE_MASTER[category as keyof typeof PRICE_MASTER];
    addTruck({
      type: '2t',
      quantity: 1,
      price: master.vehicle['2t'],
      distance: 0,
      distanceRate: 0,
      hours: 0,
      hourRate: 0,
    });
  };

  // 日程切り替え時の連動処理
  const handleDateCategoryChange = (val: string) => {
    setDateCategory(val);
    const master = PRICE_MASTER[val as keyof typeof PRICE_MASTER];
    trucks.forEach((t: any) => {
      const newPrice =
        master.vehicle[t.type as keyof typeof master.vehicle] || 0;
      updateTruck(t.id, { price: newPrice });
    });
    labors.forEach((l: any) => {
      updateLaborItem(l.id, 'unitPrice', master.worker);
    });
  };

  const handleTruckTypeChange = (id: string, type: string) => {
    const category = dateCategory || '平日';
    const master = PRICE_MASTER[category as keyof typeof PRICE_MASTER];
    const newPrice = master.vehicle[type as keyof typeof master.vehicle] || 0;
    updateTruck(id, { type, price: newPrice });
  };

  // 入力値が0の時に空文字を返すヘルパー
  const formatZero = (val: number) => (val === 0 ? '' : val);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* 📅 0. 日程区分選択 */}
      <section className="bg-[#003366] p-5 shadow-lg rounded-xl text-white mx-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-[10px] uppercase tracking-widest opacity-70">
            Pricing Mode
          </h3>
          <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded font-bold">
            2020.01.10 改定準拠
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(PRICE_MASTER).map((key) => (
            <button
              key={key}
              onClick={() => handleDateCategoryChange(key)}
              className={`py-3 rounded-lg text-xs font-black transition-all border-2 ${
                dateCategory === key
                  ? 'bg-yellow-400 border-yellow-400 text-[#003366] shadow-md'
                  : 'bg-white/10 border-transparent text-white/60 hover:bg-white/20'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </section>

      {/* 🚚 1. 車両編成 */}
      <section className="bg-white p-5 shadow-md border-t-4 border-[#003366] rounded">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-[#003366]">🚚 車両編成・運賃</h3>
          <button
            onClick={handleAddTruck}
            className="text-[10px] bg-[#003366] text-white px-3 py-1 rounded font-bold"
          >
            + 車両追加
          </button>
        </div>
        {trucks.map((t: any) => {
          const distanceOverage = Math.max(Number(t.distance || 0) - 100, 0);
          const hourOverage = Math.max(Number(t.hours || 0) - 8, 0);
          const lineTotal =
            Number(t.price || 0) * Number(t.quantity || 0) +
            distanceOverage * Number(t.distanceRate || 0) +
            hourOverage * Number(t.hourRate || 0);
          return (
            <div
              key={t.id}
              className="bg-slate-50 p-4 rounded mb-3 border border-slate-200"
            >
              <div className="flex gap-2 mb-3">
                <select
                  value={t.type}
                  onChange={(e) => handleTruckTypeChange(t.id, e.target.value)}
                  className="flex-1 p-2 text-xs font-bold border rounded bg-white"
                >
                  <option value="1t">1t車以下</option>
                  <option value="2t">2t車</option>
                  <option value="3t">3t車</option>
                  <option value="4t">4t車</option>
                </select>
                <input
                  type="number"
                  value={formatZero(t.quantity)}
                  onChange={(e) =>
                    updateTruck(t.id, { quantity: Number(e.target.value) })
                  }
                  className="w-12 p-2 text-xs text-center border rounded bg-white font-mono font-bold appearance-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-right">
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-400 font-bold">
                    単価
                  </span>
                  <input
                    type="number"
                    value={formatZero(t.price)}
                    onChange={(e) =>
                      updateTruck(t.id, { price: Number(e.target.value) })
                    }
                    className="p-1 text-xs border rounded font-mono appearance-none"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-400 font-bold">
                    距離(km)
                  </span>
                  <input
                    type="number"
                    value={formatZero(t.distance)}
                    onChange={(e) =>
                      updateTruck(t.id, { distance: Number(e.target.value) })
                    }
                    className="p-1 text-xs border rounded font-mono appearance-none"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-400 font-bold">
                    小計
                  </span>
                  <div className="p-1 text-xs font-black font-mono">
                    ¥{lineTotal.toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeTruck(t.id)}
                className="text-[9px] text-red-400 font-bold mt-2"
              >
                削除
              </button>
            </div>
          );
        })}
      </section>

      {/* 👤 2. 作業スタッフ */}
      <section className="bg-white p-5 shadow-md border-t-4 border-orange-500 rounded">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-orange-600">
            👤 作業スタッフ・人件費
          </h3>
          <button
            onClick={handleAddLabor}
            className="text-[10px] bg-orange-500 text-white px-3 py-1 rounded font-bold"
          >
            + 追加
          </button>
        </div>
        {labors.map((l: any) => (
          <div
            key={l.id}
            className="bg-orange-50/30 p-4 rounded mb-3 border border-orange-100"
          >
            <div className="flex gap-2 mb-3">
              <select
                value={l.type}
                onChange={(e) => updateLaborItem(l.id, 'type', e.target.value)}
                className="flex-1 p-2 text-xs font-black border rounded bg-white"
              >
                <option value="allDay">1日作業 (8h)</option>
                <option value="halfDay">半日</option>
                <option value="hourly">時間制</option>
              </select>
              <input
                type="number"
                value={formatZero(l.staffCount)}
                onChange={(e) =>
                  updateLaborItem(l.id, 'staffCount', Number(e.target.value))
                }
                className="w-12 p-2 text-xs text-center border rounded bg-white font-mono font-bold appearance-none"
              />
            </div>
            <div className="flex justify-between items-center">
              <input
                type="number"
                value={formatZero(l.unitPrice)}
                onChange={(e) =>
                  updateLaborItem(l.id, 'unitPrice', Number(e.target.value))
                }
                className="w-24 p-1 text-xs border rounded font-mono appearance-none"
              />
              <button
                onClick={() => removeLaborItem(l.id)}
                className="text-[9px] text-red-400 font-bold"
              >
                削除
              </button>
              <div className="text-sm font-black text-orange-600 font-mono">
                ¥{(l.unitPrice * l.staffCount).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ✨ 3. 付帯・実費 */}
      <section className="bg-white p-5 shadow-md border-t-4 border-red-600 rounded">
        <h3 className="font-black text-slate-800 mb-4">✨ 付帯・実費</h3>
        <div className="grid grid-cols-4 gap-1 mb-4">
          {SERVICE_PRESETS.map((p: string) => (
            <button
              key={p}
              onClick={() => addService(p)}
              className="p-2 border border-slate-200 hover:bg-red-50 text-[8px] font-bold rounded"
            >
              {p}
            </button>
          ))}
        </div>
        {services.map((s: any) => (
          <div
            key={s.id}
            className="bg-slate-50 p-3 rounded border mb-2 flex justify-between items-center"
          >
            <input
              type="text"
              value={s.name}
              onChange={(e) => updateService(s.id, { name: e.target.value })}
              className="flex-1 p-1 text-xs font-bold bg-transparent border-b outline-none"
            />
            <div className="flex items-center gap-2 ml-4">
              <input
                type="number"
                value={formatZero(s.price)}
                onChange={(e) =>
                  updateService(s.id, { price: Number(e.target.value) })
                }
                className="w-20 p-1 text-xs text-right border rounded font-mono appearance-none"
              />
              <button
                onClick={() => removeService(s.id)}
                className="text-slate-400 text-xl leading-none"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* 🉐 4. 割引設定 */}
      <section className="bg-white p-5 shadow-md border-t-4 border-emerald-500 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🉐</span>
          <h3 className="font-black text-emerald-600 text-sm">
            特別割引・キャンペーン
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <div>
              <p className="text-[10px] font-black text-emerald-700 uppercase">
                Rate Discount
              </p>
              <p className="text-[11px] font-bold text-slate-600">
                基本運賃・人件費割引
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formatZero(discountRate)}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
                className="w-16 p-2 text-right border-2 border-emerald-200 rounded font-mono font-bold outline-none focus:border-emerald-500 appearance-none"
              />
              <span className="font-black text-emerald-700">%</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <button
              onClick={() =>
                addFixedDiscount({ name: '特別お値引き', price: 5000 })
              }
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[9px] font-black rounded uppercase tracking-widest transition-all"
            >
              + 固定額の割引を追加
            </button>

            <div className="mt-3 space-y-2">
              {fixedDiscounts?.map((d: any) => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-dashed border-slate-300"
                >
                  <input
                    type="text"
                    value={d.name}
                    onChange={(e) =>
                      updateFixedDiscount(d.id, { name: e.target.value })
                    }
                    className="flex-1 bg-transparent text-[10px] font-bold outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-red-500">
                      -¥
                    </span>
                    <input
                      type="number"
                      value={formatZero(d.price)}
                      onChange={(e) =>
                        updateFixedDiscount(d.id, {
                          price: Number(e.target.value),
                        })
                      }
                      className="w-20 bg-white border rounded p-1 text-[10px] font-mono font-bold text-red-600 text-right shadow-sm appearance-none"
                    />
                  </div>
                  <button
                    onClick={() => removeFixedDiscount(d.id)}
                    className="text-slate-300 hover:text-red-500 font-bold px-1 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 💡 CSSの注入（スピンボタンを非表示にするため） */}
      <style jsx>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
