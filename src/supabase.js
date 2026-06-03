import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cria o cliente apenas se as variáveis estiverem configuradas,
// caso contrário, retorna um mock ou lança erro dependendo da necessidade.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
