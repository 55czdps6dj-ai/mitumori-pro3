// @ts-nocheck
'use client';

import React, { useState } from 'react';
import {
  DEFAULT_VEHICLE_PRICES,
  type VehiclePriceTable,
  type VehicleKey,
} from '../../estimate/store/vehicleJudgment';

interface Props {
  table: VehiclePriceTable;
  onSave: (newTable: VehiclePriceTable) => void;
  onClose: () => void;
}

const VEHICLE_KEYS: VehicleKey[] = ['2T車', '2T車L', '3T車', '2台口以上'];

export default function VehiclePriceAdminModal({
  table,
  onSave,
  onClose,
}: Props) {
  const [draft, setDraft] = useState({ ...table });

  const update = (key, idx, value) => {
    setDraft((prev) => {
      const next = { ...prev };
      next[key] = [...prev[key]];
      next[key][idx] = Number(value) || 0;
      return next;
    });
  };

  const handleReset = () => {
    if (!confirm('デフォルト単価に戻しますか？')) return;
    setDraft({ ...DEFAULT_VEHICLE_PRICES });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-[#003366] text-white px-5 py-4 flex justify-between items-center">
          <div>
            <h2 className="font-black text-sm">⚙️ 車両単価設定</h2>
            <p className="text-[9px] opacity-60 mt-0.5">管理者専用</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl font-black"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 mb-1">
            <div className="text-[9px] font-black text-slate-400">車種</div>
            <div className="text-[9px] font-black text-slate-400 text-center">
              通常料金
            </div>
            <div className="text-[9px] font-black text-slate-400 text-center">
              時間指定
            </div>
          </div>
          {VEHICLE_KEYS.map((key) => (
            <div key={key} className="grid grid-cols-3 gap-2 items-center">
              <div className="text-xs font-black text-[#003366]">{key}</div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                  ¥
                </span>
                <input
                  type="number"
                  value={draft[key][0]}
                  onChange={(e) => update(key, 0, e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-5 pr-2 py-2 text-xs font-black text-right outline-none focus:border-[#003366]"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                  ¥
                </span>
                <input
                  type="number"
                  value={draft[key][1]}
                  onChange={(e) => update(key, 1, e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-5 pr-2 py-2 text-xs font-black text-right outline-none focus:border-yellow-400"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mx-4 mb-3 bg-slate-50 rounded-xl p-3">
          <p className="text-[9px] font-black text-slate-400 mb-1.5">
            📏 判定基準（変更不可）
          </p>
          <div className="space-y-0.5 text-[9px] font-bold text-slate-500">
            <div className="flex justify-between">
              <span>2T車</span>
              <span>〜 200P</span>
            </div>
            <div className="flex justify-between">
              <span>2T車L</span>
              <span>201 〜 260P</span>
            </div>
            <div className="flex justify-between">
              <span>3T車</span>
              <span>261 〜 360P</span>
            </div>
            <div className="flex justify-between">
              <span>2台口以上</span>
              <span>361P 〜</span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-50 transition-all"
          >
            デフォルトに戻す
          </button>
          <button
            onClick={() => onSave(draft)}
            className="flex-[2] py-2.5 bg-[#003366] text-white rounded-xl text-xs font-black hover:bg-[#004499] transition-all shadow-md"
          >
            保存して閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
