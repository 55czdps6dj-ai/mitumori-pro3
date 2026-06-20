'use client';

import { FormEvent, useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message || 'ログインに失敗しました。');
      }

      window.location.href = '/';
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-slate-200 shadow-xl rounded-lg p-6 space-y-5"
      >
        <div className="space-y-1">
          <h1 className="text-xl font-black text-[#003366]">
            見積システム ログイン
          </h1>
          <p className="text-xs text-slate-500 font-bold">
            試験運用中の仮メール・パスワード認証です。
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-black text-slate-600">
            メールアドレス
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full border-2 border-slate-200 rounded-lg px-3 py-3 text-sm outline-none focus:border-[#003366]"
            autoComplete="email"
            autoFocus
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-black text-slate-600">
            パスワード
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border-2 border-slate-200 rounded-lg px-3 py-3 text-sm outline-none focus:border-[#003366]"
            autoComplete="current-password"
          />
        </label>

        {errorMessage && (
          <p className="bg-red-50 text-red-600 border border-red-100 rounded-md px-3 py-2 text-xs font-bold">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#003366] text-white py-3 rounded-lg font-black text-sm disabled:bg-slate-400"
        >
          {isSubmitting ? '確認中...' : 'ログイン'}
        </button>
      </form>
    </main>
  );
}
