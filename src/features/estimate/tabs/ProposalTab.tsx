// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { calculateTotalWithTax } from '../calculateEstimateTotals';

type Props = {
  store: any;
  onPrintClick?: () => void | Promise<void>;
};

export default function ProposalTab({ store, onPrintClick }: Props) {
  const [isPublishing, setIsPublishing] = useState(false);
  const { costs, customer, updateCustomer, materials, updateMaterial } = store;
  const visibleMaterials = (materials || []).filter(
    (m: any) => m.name !== 'ハンガーBOX'
  );
  const getStep = (m: any) => Number(m.step || 1);

  // 税込金額の計算（10%）
  const subtotal = costs?.subtotal || 0;
  const taxIncluded = calculateTotalWithTax(subtotal);

  // 見積有効期限の計算（今日から30日後）
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  const expiryStr = expiryDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 発行ボタンハンドラー
  const handleFinalize = async () => {
    // 担当者が未入力の場合の簡易ガード（任意）
    if (!customer?.estimator) {
      if (!confirm('担当者名が入力されていません。このまま発行しますか？')) {
        return;
      }
    }
    if (!onPrintClick) return;

    setIsPublishing(true);
    try {
      await onPrintClick();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 animate-in fade-in duration-500 pb-20 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full p-4 space-y-6">
        {/* 1. サマリーカード */}
        <div className="bg-white border-2 border-[#003366] shadow-xl overflow-hidden mt-6 rounded-lg">
          <div className="bg-[#003366] text-white p-4 flex justify-between items-center">
            <h3 className="font-black text-sm flex items-center gap-2">
              <span className="bg-red-600 w-1.5 h-4"></span>
              最終御見積サマリー
            </h3>
            <span className="text-[10px] bg-white/20 px-2 py-1 rounded">
              有効期限：{expiryStr}
            </span>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <div className="text-2xl font-black text-slate-800">
                  {customer?.name || '（未入力）'} 様
                </div>
                <div className="mt-2 font-bold text-slate-600 flex flex-col gap-1 text-sm">
                  <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                    Schedule
                  </span>
                  <span>引越予定日：{customer?.moveDate || 'ご相談'}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                  Staff in Charge / 担当者名
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-100 rounded-lg text-sm font-bold focus:border-[#003366] outline-none transition-all"
                  placeholder="担当者名を入力してください"
                  value={customer?.estimator || ''}
                  onChange={(e) =>
                    updateCustomer({ estimator: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="text-center md:border-l border-slate-200">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Total Amount (Incl. Tax)
              </div>
              <div className="text-5xl font-black text-[#003366]">
                ¥{taxIncluded.toLocaleString()}
              </div>
              <p className="text-sm text-slate-500 font-bold mt-1">
                （小計: ¥{subtotal.toLocaleString()} + 消費税）
              </p>
            </div>
          </div>
        </div>

        {/* 2. サービス資材の最終調整 */}
        <div className="bg-white border-2 border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <h4 className="font-black text-slate-700 flex items-center gap-2 text-sm uppercase">
              <span className="text-blue-600">📦</span> サービス資材の最終数量
            </h4>
          </div>

          <div className="divide-y divide-slate-100">
            {visibleMaterials.map((m: any) => (
              <div
                key={m.id}
                className="flex justify-between items-center px-6 py-3 hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-700 text-sm">
                  {m.name}
                </span>

                <div className="flex items-center gap-4 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-sm">
                  <button
                    onClick={() =>
                      updateMaterial(
                        m.id,
                        Math.max(0, Number(m.quantity || 0) - getStep(m))
                      )
                    }
                    className={`w-10 h-10 flex items-center justify-center font-black text-xl transition-all rounded-lg ${
                      m.quantity > 0
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-slate-200'
                    }`}
                    disabled={m.quantity <= 0}
                  >
                    －
                  </button>

                  <div className="flex flex-col items-center min-w-[40px]">
                    <span className="text-xs font-black text-slate-300 uppercase leading-none mb-0.5">
                      Qty
                    </span>
                    <span className="font-mono font-black text-lg text-[#003366] leading-none">
                      {m.quantity}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      updateMaterial(m.id, Number(m.quantity || 0) + getStep(m))
                    }
                    className="w-10 h-10 flex items-center justify-center font-black text-xl text-blue-600 hover:bg-blue-50 transition-all rounded-lg"
                  >
                    ＋
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 特記事項 */}
        <div className="bg-white p-6 border-2 border-slate-200 rounded-lg shadow-sm">
          <h4 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase">
            <span className="text-blue-600">✍️</span> 見積書に記載する特記事項
          </h4>
          <textarea
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:border-[#003366] focus:ring-0 transition-all min-h-[100px]"
            placeholder="例：当日、マンション前の道が狭いため軽トラックでのピストン輸送となります。"
            value={customer?.notes || ''}
            onChange={(e) => updateCustomer({ notes: e.target.value })}
          />
        </div>

        {/* 4. 発行ボタンエリア */}
        <div className="bg-[#003366] p-10 rounded-2xl flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 text-white/5 text-9xl font-black italic select-none">
            PRINT
          </div>

          <div className="text-center z-10">
            <h4 className="font-black text-white text-xl mb-2 italic">
              ESTIMATE FINALIZATION
            </h4>
            <p className="text-sm text-blue-200">
              すべての内容を確認しました。
              <br />
              ボタンを押すと、雛形からGoogleスプレッドシートを作成します。
            </p>
          </div>

          <button
            onClick={handleFinalize}
            disabled={isPublishing}
            className="group bg-red-600 hover:bg-red-500 text-white w-full max-w-md py-6 font-black text-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 rounded-2xl z-10"
          >
            <span className="group-hover:animate-bounce text-3xl">📄</span>
            {isPublishing ? '作成中...' : 'スプレッドシートを作成'}
          </button>
        </div>
      </div>
    </div>
  );
}
