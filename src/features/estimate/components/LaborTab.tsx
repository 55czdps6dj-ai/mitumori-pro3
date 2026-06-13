// @ts-nocheck
'use client';
import React from 'react';
import { useEstimateStore } from '../useEstimateStore';
import { v4 as uuid } from 'uuid';

export default function LaborTab() {
  // セレクターを使わず、直接 store からデストラクトすることで型推論エラーを回避
  const { labors, addLaborItem, updateLaborItem, removeLaborItem } =
    useEstimateStore();

  const handleAddLabor = () => {
    addLaborItem({
      id: uuid(),
      role: '作業員',
      staffCount: 1,
      unitPrice: 18000,
    });
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">👷 作業員設定</h2>
        <button
          onClick={handleAddLabor}
          className="bg-[#003366] text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg active:scale-95 transition-all"
        >
          ＋ 人員追加
        </button>
      </div>

      <div className="space-y-3">
        {labors.map((l) => (
          <div
            key={l.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
          >
            <div className="flex justify-between items-center">
              <select
                value={l.role}
                onChange={(e) => updateLaborItem(l.id, 'role', e.target.value)}
                className="bg-slate-100 p-2 rounded-lg font-bold text-sm outline-none"
              >
                <option value="作業員">作業員</option>
                <option value="運転手">運転手</option>
                <option value="梱包員">梱包員</option>
                <option value="ガードマン">ガードマン</option>
              </select>
              <button
                onClick={() => removeLaborItem(l.id)}
                className="text-red-400 text-xs font-bold"
              >
                削除
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">
                  人数
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={l.staffCount}
                    onChange={(e) =>
                      updateLaborItem(
                        l.id,
                        'staffCount',
                        Number(e.target.value)
                      )
                    }
                    className="w-full p-2 bg-slate-50 border rounded-lg text-right font-bold"
                  />
                  <span className="text-xs font-bold">名</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">
                  単価
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={l.unitPrice}
                    onChange={(e) =>
                      updateLaborItem(l.id, 'unitPrice', Number(e.target.value))
                    }
                    className="w-full p-2 bg-slate-50 border rounded-lg text-right font-bold"
                  />
                  <span className="text-xs font-bold">円</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
