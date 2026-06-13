// @ts-nocheck
'use client';
import { useEstimateStore } from '../useEstimateStore'; // パスが ../ であることを確認

export default function Header() {
  // セレクターを使わず、直接 store 全体を取得してデストラクトする
  const { clearEstimate } = useEstimateStore();

  return (
    <header className="bg-[#003366] text-white p-3 flex justify-between items-center z-20 shadow-md">
      <div className="flex items-center gap-2">
        <div className="bg-white text-[#003366] px-1.5 py-0.5 font-black italic text-xs rounded">
          KEIO
        </div>
        <h1 className="font-black text-sm uppercase">引越見積システム v3.2</h1>
      </div>
      <button
        onClick={() => {
          if (confirm('データをクリアしますか？')) clearEstimate();
        }}
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-[10px] font-black"
      >
        🗑️ リセット
      </button>
    </header>
  );
}
