import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://townmqgicdxkwmuskscx.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
