import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fjbadoisrcumdcwpcadt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqYmFkb2lzcmN1bWRjd3BjYWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzI3NDIsImV4cCI6MjA2NTQwODc0Mn0.h7BC7ZT_6en4xeJpNtrScLEo28nnDyvcqgmaiIWcEPA'; // Usa la Public API Key (anon)

export const supabase = createClient(supabaseUrl, supabaseKey);