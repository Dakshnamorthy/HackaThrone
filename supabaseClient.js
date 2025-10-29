import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lksrqjyinjhsodnnudfm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrc3Jxanlpbmpoc29kbm51ZGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDM2NDEsImV4cCI6MjA3NzIxOTY0MX0.kZV5vhCtzyELTb9uLLKhuF8Bvix9wFUEJi4SNHbPDxM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
