import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://mwbbrlzdnivdjwjaflax.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YmJybHpkbml2ZGp3amFmbGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMDIyOTksImV4cCI6MjA1NDc3ODI5OX0.sChj1KGRSOPTLLwx7JpldnOtrkua102bAQrQl4328Ps";

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);