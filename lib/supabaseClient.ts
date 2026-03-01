import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fwskjpkeyicbyxkkqpqj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3c2tqcGtleWljYnl4a2txcHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMyNDksImV4cCI6MjA4NTg3OTI0OX0.mpndR9rQ_JaTXnJ8OX5OSJ6iLlyYVz_m8BUkmnP_ido";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
