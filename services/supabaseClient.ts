import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wfkegpmbcbyqsrkputur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma2VncG1iY2J5cXNya3B1dHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNDU1NzAsImV4cCI6MjA3ODgyMTU3MH0.wk7zl9rt1WHXjW_5BtqrtsnNQpSukhB4ebW97oOmyf8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Supabase uses localStorage by default, which is fine for this app
        persistSession: true, 
    },
});
