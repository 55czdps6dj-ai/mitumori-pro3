"use client";
import React from "react";

type Props = { store: any };

export default function WorkConditionTab({ store }: Props) {
  const { workConditions, updateWorkCondition, materials, updateMaterialQty } = store;

  return (
    <div className="p-4 max-w-3xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
      
      {/* 1. 作業内容の区分設定 */}
      <section className="space-y-4">
        <h3 className="text-lg font-black text-[#003366] flex items-center gap-2 border-b-2 border-slate-100 pb-2">
          <span className="w-2 h-6 bg-red-600"></span>
          作業区分（当社 / お客様）
        </h3>
        <div className="grid gap-3">
          {workConditions.map((condition: any) => (
            <div key={condition.id} className="bg-white border-2 border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <span className="font-bold text-slate-700">{condition.label}</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {["当社", "お客様", "なし"].map((option) => (
                  <button
                    key={option}
                    onClick={() => updateWorkCondition(condition.id, option)}
                    className={`px-4 py-1.5 rounded-md text-xs font-black transition-all ${
                      condition.value === option
                        ? "bg-[#003366] text-white shadow-md"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. 資材明細・数量入力 */}
      <section className="space-y-4">
        <h3 className="text-lg font-black text-[#003366] flex items-center gap-2 border-b-2 border-slate-100 pb-2">
          <span className="w-2 h-6 bg-[#003366]"></span>
          荷造梱包資材
        </h3>
        <div className="bg-white border-2 border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">品名 / 単価</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">数量</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-right">小計</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
              {materials.map((m: any) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="text-sm text-slate-800">{m.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono italic">@¥{m.unitPrice}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => updateMaterialQty(m.id, m.quantity - 1)}
                        className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all"
                      >-</button>
                      <span className="w-8 text-center font-mono text-lg">{m.quantity}</span>
                      <button 
                        onClick={() => updateMaterialQty(m.id, m.quantity + 1)}
                        className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all"
                      >+</button>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-[#003366]">
                    ¥{(m.unitPrice * m.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-[#003366] text-white p-4 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase opacity-70">Material Total</span>
            <span className="font-mono font-black text-xl">
              ¥{materials.reduce((sum: number, m: any) => sum + (m.unitPrice * m.quantity), 0).toLocaleString()}
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}