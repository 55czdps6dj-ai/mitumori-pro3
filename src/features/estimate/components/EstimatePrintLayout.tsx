// @ts-nocheck
'use client';

import React from 'react';
import { useEstimateStore } from '../useEstimateStore';

export default function EstimatePrintLayout({ onBack }: { onBack: () => void }) {
  const store = useEstimateStore();
  // 💡 storeから必要なデータをすべて取り出します
  const { customer, items, labors, services } = store;

  // 💡 合計金額をここで再計算します
  const totalLabor = labors.reduce((sum, l) => sum + (l.staffCount * l.unitPrice), 0);
  const totalService = services.reduce((sum, s) => sum + (s.price || 0), 0);
  const grandTotal = Math.round((totalLabor + totalService) * 1.1); // 税込

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      {/* 操作パネル：印刷時には非表示 */}
      <div className="max-w-4xl mx-auto print:hidden mb-8">
        <div className="bg-white shadow-xl rounded-2xl p-6 border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-slate-800">🖨️ 見積書の発行</h1>
            <button onClick={onBack} className="text-blue-600 font-bold text-sm">← 戻る</button>
          </div>

          <button
            onClick={handlePrint}
            className="w-full bg-[#003366] hover:bg-slate-800 text-white py-4 rounded-xl shadow-lg transition-all flex flex-col items-center gap-1 active:scale-95"
          >
            <span className="text-2xl">📄</span>
            <span className="font-black">PDFを発行する / 印刷する</span>
          </button>
        </div>
      </div>

      {/* --- 印刷用レイアウト --- */}
      <div className="print-area bg-white mx-auto shadow-lg border border-slate-200">
        <div className="p-10 text-slate-800" id="estimate-sheet">
          {/* ヘッダー */}
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-4 mb-8">
            <h1 className="text-4xl font-black tracking-[0.5em]">御見積書</h1>
            <p className="text-sm">発行日：{new Date().toLocaleDateString('ja-JP')}</p>
          </div>

          {/* 宛名と合計金額 */}
          <div className="flex justify-between mb-12">
            <div className="w-2/3">
              <p className="text-2xl font-bold underline underline-offset-8 mb-8">
                {customer.name || '　　　　'} 様
              </p>
              <div className="bg-slate-900 text-white p-6 inline-block min-w-[320px]">
                <span className="text-xs uppercase">合計金額（税込）</span>
                <div className="text-4xl font-black text-center">
                  ¥{grandTotal.toLocaleString()}-
                </div>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold text-lg mb-1">引越支援システム</p>
              <p>〒182-0021</p>
              <p>東京都調布市調布ヶ丘1-1-1</p>
            </div>
          </div>

          {/* 明細：人件費 */}
          <div className="mb-8">
            <h3 className="text-sm font-black bg-slate-100 p-2 mb-3 border-l-4 border-slate-900">■ 人件費明細</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-400 text-left">
                  <th className="py-2">項目</th>
                  <th className="py-2 text-center">人数</th>
                  <th className="py-2 text-right">単価</th>
                  <th className="py-2 text-right">小計</th>
                </tr>
              </thead>
              <tbody>
                {labors.map((l) => (
                  <tr key={l.id} className="border-b border-slate-200">
                    <td className="py-2">{l.role === 'fullDay' ? '1日作業' : l.role}</td>
                    <td className="py-2 text-center">{l.staffCount}名</td>
                    <td className="py-2 text-right">¥{l.unitPrice.toLocaleString()}</td>
                    <td className="py-2 text-right font-bold">¥{(l.staffCount * l.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 明細：サービス */}
          <div className="mb-8">
            <h3 className="text-sm font-black bg-slate-100 p-2 mb-3 border-l-4 border-slate-900">■ 付帯サービス明細</h3>
            <table className="w-full text-sm border-collapse">
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-b border-slate-200">
                    <td className="py-2">{s.name}</td>
                    <td className="py-2 text-right font-bold">¥{(s.price || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media screen {
          .print-area {
            max-width: 210mm;
            min-height: 297mm;
          }
        }
        @media print {
          .print:hidden { display: none !important; }
          .print-area {
            width: 100%;
            margin: 0;
            padding: 0;
            border: none;
          }
          @page { margin: 10mm; }
        }
      `}</style>
    </div>
  );
}