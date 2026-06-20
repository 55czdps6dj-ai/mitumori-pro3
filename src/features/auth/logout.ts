export const logout = async () => {
  const { supabase } = await import('../../lib/supabase');
  await supabase.auth.signOut();
  window.location.href = '/login';
};
