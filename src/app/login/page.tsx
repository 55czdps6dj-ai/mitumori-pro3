'use client';

import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabase';

type AuthMode = 'login' | 'signup' | 'reset';
type SignupStep = 'email' | 'code' | 'password';

const AUTH_MODES: Array<{ key: AuthMode; label: string }> = [
  { key: 'login', label: 'ログイン' },
  { key: 'signup', label: '新規登録' },
  { key: 'reset', label: '再設定' },
];

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return '認証処理に失敗しました。入力内容を確認してください。';
};

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [signupStep, setSignupStep] = useState<SignupStep>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isSignupEmailStep = mode === 'signup' && signupStep === 'email';
  const isSignupCodeStep = mode === 'signup' && signupStep === 'code';
  const isSignupPasswordStep = mode === 'signup' && signupStep === 'password';
  const shouldShowPasswordInput = mode === 'login' || isSignupPasswordStep;

  const resetFormState = (nextMode: AuthMode) => {
    setMode(nextMode);
    setSignupStep('email');
    setOtpCode('');
    setPassword('');
    setErrorMessage('');
    setMessage('');
  };

  const getSubmitLabel = () => {
    if (isSubmitting) {
      return '処理中...';
    }

    if (mode === 'signup') {
      if (signupStep === 'email') {
        return '認証コードを送信';
      }

      if (signupStep === 'code') {
        return 'コードを確認';
      }

      return 'パスワードを設定';
    }

    if (mode === 'reset') {
      return '再設定メールを送信';
    }

    return 'ログイン';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setMessage('');

    try {
      if (mode === 'signup') {
        if (signupStep === 'email') {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: true,
            },
          });
          if (error) throw error;

          setSignupStep('code');
          setMessage('認証コードを送信しました。メールを確認してください。');
          return;
        }

        if (signupStep === 'code') {
          const { error } = await supabase.auth.verifyOtp({
            email,
            token: otpCode.replace(/\s/g, ''),
            type: 'email',
          });
          if (error) throw error;

          setSignupStep('password');
          setMessage('認証できました。ログイン用パスワードを設定してください。');
          return;
        }

        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        setMessage('パスワードを設定しました。見積システムへ移動します。');
        window.location.href = '/';
        return;
      }

      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;

        setMessage('パスワード再設定メールを送信しました。');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      window.location.href = '/';
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
            見積システム ログイン
          </h1>
          <p className="text-xs text-slate-500 font-bold">
            Supabase Authでログインします。
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-slate-100 rounded-lg p-1">
          {AUTH_MODES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => resetFormState(key)}
              className={`py-2 rounded-md text-[11px] font-black ${
                mode === key
                  ? 'bg-white text-[#003366] shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
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
            required
            disabled={isSignupCodeStep || isSignupPasswordStep}
          />
        </label>

        {isSignupCodeStep && (
          <label className="block space-y-2">
            <span className="text-xs font-black text-slate-600">
              認証コード
            </span>
            <input
              type="text"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value)}
              className="w-full border-2 border-slate-200 rounded-lg px-3 py-3 text-sm outline-none focus:border-[#003366]"
              autoComplete="one-time-code"
              inputMode="numeric"
              required
            />
          </label>
        )}

        {shouldShowPasswordInput && (
          <label className="block space-y-2">
            <span className="text-xs font-black text-slate-600">
              パスワード
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border-2 border-slate-200 rounded-lg px-3 py-3 text-sm outline-none focus:border-[#003366]"
              autoComplete={
                isSignupPasswordStep ? 'new-password' : 'current-password'
              }
              required
              minLength={6}
            />
          </label>
        )}

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
          {getSubmitLabel()}
        </button>
      </form>
    </main>
  );
}
