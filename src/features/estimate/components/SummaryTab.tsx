// @ts-nocheck
'use client';

import { useEstimateStore } from '../useEstimateStore';

export default function SummaryTab() {
  const store = useEstimateStore();

  // Storeの計算ロジック（costs）がある場合はそちらを優先、
  // なければ現在のロジックで計算します
  const costs = store.costs || {};

  const totalLabor = store.labors.reduce(
    (sum, l) => sum + l.staffCount * l.unitPrice,
    0
  );
  const totalService = store.services.reduce(
    (sum, s) => sum + (s.price || 0),
    0
  );

  // 運賃（trucks）なども含めた最終的な総合計を表示
  const grandTotal = costs.subtotal || totalLabor + totalService;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 print:border-none print:shadow-none">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <span>💰</span> 見積計算結果
        </h2>

        <div className="space-y-4 text-lg">
          <div className="flex justify-between border-b border-slate-100 pb-3">
            <span className="text-slate-500 font-bold">人件費合計</span>
            <span className="font-mono font-bold">
              ¥{totalLabor.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-3">
            <span className="text-slate-500 font-bold">付帯サービス合計</span>
            <span className="font-mono font-bold">
              ¥{totalService.toLocaleString()}
            </span>
          </div>

          {/* 総合計エリア：印刷時はここがメインになります */}
          <div className="flex justify-between items-end pt-4">
            <span className="text-sm font-black text-blue-600 uppercase tracking-widest">
              Grand Total
            </span>
            <div className="text-right">
              <span className="text-4xl font-black text-blue-600 font-mono">
                ¥{grandTotal.toLocaleString()}
              </span>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                ※消費税および地方消費税を含む
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🖨️ アクションエリア（印刷時は非表示） */}
      <div className="no-print px-1">
        <button
          onClick={() => window.print()}
          className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <span className="text-2xl">🖨️</span>
          見積書をPDF出力 / 印刷
        </button>
        <p className="text-center text-slate-400 text-xs mt-4 font-bold">
          ※ボタンを押すとブラウザの印刷プレビューが開きます
        </p>
      </div>

      {/* 💡 印刷専用スタイル */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          /* 印刷時は余白を調整し、背景を白に固定 */
          body {
            background-color: white !important;
            color: black !important;
          }
          /* 影を消してフラットにする */
          .shadow-sm, .shadow-xl {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
