'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const clearBrowserData = () => {
    localStorage.removeItem('estimate-storage');
    localStorage.removeItem('mitumori-staff-list');
    reset();
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white border border-red-100 rounded-lg shadow-xl p-6 space-y-4">
        <div>
          <h1 className="text-lg font-black text-red-700">
            画面の読み込みでエラーが発生しました
          </h1>
          <p className="mt-2 text-sm text-slate-600 font-bold">
            ブラウザに残っている古い一時保存データが原因の場合があります。
          </p>
        </div>

        <pre className="bg-slate-950 text-red-100 rounded-md p-3 text-xs overflow-auto whitespace-pre-wrap">
          {error?.message || 'Unknown error'}
        </pre>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 bg-[#003366] text-white py-3 rounded-lg font-black text-sm"
          >
            再読み込み
          </button>
          <button
            onClick={clearBrowserData}
            className="flex-1 bg-red-600 text-white py-3 rounded-lg font-black text-sm"
          >
            一時データを消去
          </button>
        </div>
      </div>
    </main>
  );
}
