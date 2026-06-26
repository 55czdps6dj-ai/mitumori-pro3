'use client';

import { FormEvent, useState } from 'react';
import {
  isSupabaseConfigured,
  supabase,
  supabaseConfigError,
} from '../../lib/supabase';

const isPasswordLoginEnabled =
  process.env.NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN === 'true';

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return '認証処理に失敗しました。設定内容を確認してください。';
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const requireSupabaseConfig = () => {
    if (!isSupabaseConfigured) {
      throw new Error(supabaseConfigError);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      requireSupabaseConfig();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      requireSupabaseConfig();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      window.location.href = '/';
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <section className="w-full max-w-sm bg-white border border-slate-200 shadow-xl rounded-lg p-6 space-y-5">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-[#003366]">
            見積システム ログイン
          </h1>
          <p className="text-xs text-slate-500 font-bold">
            会社運用ではMicrosoft 365アカウントでログインします。
          </p>
        </div>

        <button
          type="button"
          onClick={handleMicrosoftLogin}
          disabled={isSubmitting}
          className="w-full bg-[#003366] text-white py-3 rounded-lg font-black text-sm disabled:bg-slate-400"
        >
          {isSubmitting ? '認証画面へ移動中...' : 'Microsoftでログイン'}
        </button>

        {isPasswordLoginEnabled && (
          <form
            onSubmit={handlePasswordLogin}
            className="border-t border-slate-200 pt-5 space-y-4"
          >
            <p className="text-[11px] text-slate-500 font-bold">
              試験用ログイン
            </p>

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
                required
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
                required
                minLength={6}
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-800 text-white py-3 rounded-lg font-black text-sm disabled:bg-slate-400"
            >
              {isSubmitting ? '確認中...' : '試験用ログイン'}
            </button>
          </form>
        )}

        {errorMessage && (
          <p className="bg-red-50 text-red-600 border border-red-100 rounded-md px-3 py-2 text-xs font-bold">
            {errorMessage}
          </p>
        )}
      </section>
    </main>
  );
}
