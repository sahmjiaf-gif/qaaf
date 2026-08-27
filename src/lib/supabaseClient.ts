import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jenazmwdiqdngyacizke.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplbmF6bXdkaXFkbmd5YWNpemtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzEyMjEsImV4cCI6MjA5MDIwNzIyMX0.e-H8UzT3Z1vIOWWJybzYae2kpG3DpyqibXIxRnK7zpQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
