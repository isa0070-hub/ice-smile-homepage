import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lrgthpvydwpfjkczxwur.supabase.co";

const supabaseKey = "sb_publishable_0fkHGKaJNq3cOpJtLNhF3g_KtHTrWA6";

export const supabase = createClient(supabaseUrl, supabaseKey);