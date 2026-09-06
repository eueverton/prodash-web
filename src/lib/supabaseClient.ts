import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vnwpornmtqnevjlibwsw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZud3Bvcm5tdHFuZXZqbGlid3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzOTcxNDYsImV4cCI6MjEwMzk3MzE0Nn0.BzGUUeoB7hCH0c8JVuY3U0JxQUi_pyrXr2rEZ6K7iqM';

// Ensure a single instance is used across the client
export const supabase = createClient(supabaseUrl, supabaseKey);
