// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import EstimateApp from '../features/estimate/EstimateApp';
import ReceptionApp from '../features/reception/ReceptionApp';

export default function Home() {
  const [mode, setMode] = useState<'reception' | 'estimate'>('reception');
  const [passedCustomerData, setPassedCustomerData] = useState(null);
  const [estimateBackTo, setEstimateBackTo] = useState<'reception' | 'menu'>(
    'reception'
  );

  // ────────────────────────────────────────
  // 初回マウント時：画面幅でモードを自動判定
  // ────────────────────────────────────────
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    setMode(isMobile ? 'estimate' : 'reception');
  }, []);

  // 受付 → 見積への遷移
  const handleTransitionToEstimate = (customerData) => {
    setPassedCustomerData(customerData);
    setEstimateBackTo('reception');
    setMode('estimate');
  };

  // ── 受付・配車管理モード ──────────────────────────────
  if (mode === 'reception') {
    return (
      <main className="min-h-screen bg-white relative">
        {/* 現場見積へ切替ボタン（右下固定） */}
        <button
          onClick={() => {
            setPassedCustomerData(null);
            setEstimateBackTo('reception');
            setMode('estimate');
          }}
          className="fixed bottom-6 right-6 z-[100] bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-full shadow-2xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="text-base">📝</span>
          現場見積
        </button>
        <ReceptionApp onStartEstimate={handleTransitionToEstimate} />
      </main>
    );
  }

  // ── 現場見積モード ────────────────────────────────────
  if (mode === 'estimate') {
    return (
      <main className="min-h-screen bg-gray-50 relative">
        <EstimateApp
          initialData={passedCustomerData}
          onBack={() => {
            setPassedCustomerData(null);
            setMode(estimateBackTo);
          }}
        />
      </main>
    );
  }
}
