import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isSupabaseUrlValid = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(
  supabaseUrl
);
const isSupabaseAnonKeyAscii = /^[\x20-\x7E]+$/.test(supabaseAnonKey);
const isSupabaseAnonKeyPublic =
  supabaseAnonKey.startsWith('eyJ') ||
  supabaseAnonKey.startsWith('sb_publishable_');

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Supabaseの環境変数が未設定です。'
    : !isSupabaseUrlValid
    ? 'NEXT_PUBLIC_SUPABASE_URLの形式が正しくありません。'
    : !isSupabaseAnonKeyAscii || !isSupabaseAnonKeyPublic
    ? 'NEXT_PUBLIC_SUPABASE_ANON_KEYに正しいPublishable keyを設定してください。'
    : '';

export const isSupabaseConfigured = !supabaseConfigError;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'missing-anon-key'
);
