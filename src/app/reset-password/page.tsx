'use client';

import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabase';

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'パスワード変更に失敗しました。もう一度お試しください。';
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMessage('パスワードを変更しました。ログイン画面へ移動してください。');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
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
            パスワード再設定
          </h1>
          <p className="text-xs text-slate-500 font-bold">
            新しいパスワードを入力してください。
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-black text-slate-600">
            新しいパスワード
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border-2 border-slate-200 rounded-lg px-3 py-3 text-sm outline-none focus:border-[#003366]"
            autoComplete="new-password"
            minLength={6}
            autoFocus
            required
          />
        </label>

        {message && (
          <p className="bg-blue-50 text-blue-700 border border-blue-100 rounded-md px-3 py-2 text-xs font-bold">
            {message}
          </p>
        )}

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
          {isSubmitting ? '変更中...' : 'パスワードを変更'}
        </button>

        <a
          href="/login"
          className="block text-center text-xs font-black text-slate-500 hover:text-[#003366]"
        >
          ログイン画面へ
        </a>
      </form>
    </main>
  );
}
