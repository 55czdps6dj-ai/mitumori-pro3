"use client";

import { calculateTaxAmount, calculateTotalWithTax } from '../calculateEstimateTotals';
import LaborTab from './LaborTab';

/**
 * 料金タブ：最終調整・割引・見積サマリー
 * * 機能：
 * 1. 基本料金（車両+人件費）に対する0〜20%の割引設定
 * 2. 具体的な割引金額のリアルタイム可視化
 * 3. 自由な名称での額面値引き（出精・即決等）
 * 4. 消費税10%の明記と、税込合計金額のダイナミック表示
 */
export default function PricingTab({ store }: { store: any }) {
  const { 
    costs, discountRate, setDiscountRate, 
    fixedDiscounts, addFixedDiscount, updateFixedDiscount, removeFixedDiscount 
  } = store;

  // 基本料金（車両費＋人件費）の合算
  const basePrice = costs.transportTotal + costs.laborTotal;
  
  // 消費税設定
  const taxAmount = calculateTaxAmount(costs.subtotal);
  const totalWithTax = calculateTotalWithTax(costs.subtotal);

  return (
    <div className="space-y-6 pb-24 px-2 animate-in slide-in-from-bottom-4 duration-500">
      <LaborTab showDiscounts={false} />
      
      {/* 📉 ① 基本料金 割引設定セクション */}
      <section className="bg-white p-6 shadow-md border-t-4 border-blue-500 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h3 className="font-black text-blue-800 text-sm">📉 基本料金 割引設定</h3>
            <p className="text-[10px] text-slate-400 font-bold">車両費・人件費の合計が割引対象</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
            <input 
              type="number" 
              min="0" max="20" 
              value={discountRate} 
              onChange={(e) => setDiscountRate(Number(e.target.value))}
              className="w-12 text-center text-xl font-black font-mono bg-transparent text-blue-600 outline-none"
            />
            <span className="text-sm font-black text-blue-600">%</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-600 text-white p-4 rounded-xl shadow-inner relative overflow-hidden">
            <div className="flex justify-between items-center relative z-10">
              <span className="text-xs font-bold opacity-80 italic underline decoration-blue-300 uppercase">Discount Amount</span>
              <div className="text-right">
                <span className="text-2xl font-black font-mono">-¥{costs.rateDiscountAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-2 text-[9px] font-bold opacity-60 border-t border-white/20 pt-2">
              対象基本料金合計: ¥{basePrice.toLocaleString()}
            </div>
          </div>
        </div>
      </section>

      {/* 🎁 ② 特別値引きセクション（出精・即決） */}
      <section className="bg-white p-6 shadow-md border-t-4 border-emerald-500 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-emerald-800 text-sm">🎁 特別値引き (個別指定)</h3>
          <div className="flex gap-1">
            <button 
              onClick={() => addFixedDiscount("出精値引き")} 
              className="text-[9px] bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors"
            >
              + 出精
            </button>
            <button 
              onClick={() => addFixedDiscount("即決値引き")} 
              className="text-[9px] bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors"
            >
              + 即決
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {fixedDiscounts.length === 0 && (
            <p className="text-center py-4 text-[10px] text-slate-300 font-bold border-2 border-dashed border-slate-50 rounded-lg italic">
              追加された値引き項目はありません
            </p>
          )}
          {fixedDiscounts.map((d: any) => (
            <div key={d.id} className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <input 
                type="text" value={d.name} 
                onChange={(e) => updateFixedDiscount(d.id, { name: e.target.value })}
                className="flex-1 p-2 text-xs font-bold bg-white border rounded shadow-sm outline-none focus:ring-1 focus:ring-emerald-400"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-emerald-600">-¥</span>
                <input 
                  type="number" value={d.price} 
                  onChange={(e) => updateFixedDiscount(d.id, { price: Number(e.target.value) })}
                  className="w-24 p-2 text-xs font-mono text-right border rounded shadow-sm bg-white outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <button onClick={() => removeFixedDiscount(d.id)} className="text-slate-300 hover:text-red-400 transition-colors p-1">🗑️</button>
            </div>
          ))}
        </div>
      </section>

      {/* 📊 最終見積サマリーセクション */}
      <section className="bg-[#003366] text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl font-black italic">KEIO</div>

        <div className="space-y-4 relative z-10">
          <h4 className="text-center text-[10px] font-black tracking-[0.3em] opacity-40 uppercase mb-6">Quotation Summary</h4>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between opacity-80 border-b border-white/5 pb-1">
              <span>基本料金 (車両+人件費)</span>
              <span className="font-mono">¥{basePrice.toLocaleString()}</span>
            </div>
            
            {costs.rateDiscountAmount > 0 && (
              <div className="flex justify-between text-blue-300 font-bold italic">
                <span>基本料金割引 ({discountRate}%)</span>
                <span className="font-mono">-¥{costs.rateDiscountAmount.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between opacity-80 border-b border-white/5 pb-1">
              <span>付帯サービス・実費合計</span>
              <span className="font-mono">¥{costs.serviceTotal.toLocaleString()}</span>
            </div>
            
            {costs.fixedDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold italic">
                <span>特別値引き合計</span>
                <span className="font-mono">-¥{costs.fixedDiscountAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          {/* 金額計算の根拠（税抜・消費税） */}
          <div className="mt-8 pt-8 border-t-2 border-white/20">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center opacity-60">
                <span className="text-xs font-bold">税抜合計金額</span>
                <span className="text-lg font-mono font-bold">¥{costs.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-blue-200/80">
                <span className="text-xs font-bold">消費税 (10%)</span>
                <span className="text-lg font-mono font-bold">¥{taxAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* 最終税込合計 */}
            <div className="flex justify-between items-end border-t border-white/10 pt-4">
              <div>
                <span className="text-[10px] font-black text-yellow-400 block mb-1 uppercase italic tracking-widest leading-none">Total Amount</span>
                <span className="text-xs font-black text-yellow-400 uppercase tracking-widest italic">Tax Included</span>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black font-mono text-yellow-400 tracking-tighter drop-shadow-md">
                  ¥{totalWithTax.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* フッターアクション */}
      <div className="pt-4 pb-8 flex justify-center gap-4">
        <button className="flex-1 bg-white border-2 border-[#003366] text-[#003366] font-black py-4 rounded-xl text-xs active:scale-95 transition-all">
          一時保存
        </button>
        <button className="flex-1 bg-[#003366] text-white font-black py-4 rounded-xl text-xs shadow-lg active:scale-95 transition-all">
          PDFプレビュー
        </button>
      </div>
      
      <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
        Keio Logistics CRM System v2.1
      </p>
    </div>
  );
}
