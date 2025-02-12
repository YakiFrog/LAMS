// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

let supabaseUrl = '';
let supabaseAnonKey = '';

export const createSupabaseClient = (url: string | undefined, key: string | undefined) => {
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
};

// 初期化時にsupabaseクライアントを作成しない
export let supabase = null;