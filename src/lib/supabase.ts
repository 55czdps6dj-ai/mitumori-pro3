// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

// あなた専用のURLとキーを直接セットします
const supabaseUrl = 'https://zsdrhzuoigvqqjmywhbf.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZHJoenVvaWd2cXFqbXl3aGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzE3MzQsImV4cCI6MjA5MDc0NzczNH0.Q8IrCkkqGb0YTFIPLfTbwdJYIFSIpxSUGDzYX8f98AU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
