import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mtqxbbdmhdipyggaxwdx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10cXhiYmRtaGRpcHlnZ2F4d2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxODAxNzUsImV4cCI6MjA5NTc1NjE3NX0.xSuYBMln0fFfaQeOYHQlNq79Jh5uOoSu2gTPmdniv04'

export const supabase = createClient(supabaseUrl, supabaseKey)