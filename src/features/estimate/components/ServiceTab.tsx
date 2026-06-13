// @ts-nocheck
'use client';

import { useEstimateStore } from '../useEstimateStore';

export default function ServiceTab() {
  const store = useEstimateStore();
  const { services, updateService } = store;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800 px-1">🧰 付帯サービス</h2>

      <div className="space-y-3">
        {services.map((s) => (
          <div
            key={s.id}
            className="flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm"
          >
            <input
              value={s.name}
              onChange={(e) => updateService(s.id, { name: e.target.value })}
              className="flex-[2] p-2 border rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors"
              placeholder="サービス名"
            />

            <div className="flex flex-1 items-center gap-1">
              <input
                type="number"
                // 💡 0 または null/undefined の場合は空文字を返し、入力しやすくする
                value={s.price === 0 || s.price === null ? '' : s.price}
                onChange={(e) => {
                  const val = e.target.value;
                  // 空文字なら0を保存、数値ならそのまま保存
                  updateService(s.id, { price: val === '' ? 0 : Number(val) });
                }}
                className="w-full p-2 border rounded-lg text-sm text-right bg-slate-50 focus:bg-white appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                placeholder="金額を入力"
              />
              <span className="text-xs font-bold text-slate-500 min-w-[24px]">
                円
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
