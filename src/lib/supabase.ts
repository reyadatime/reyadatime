import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// Create a single instance of the Supabase client for use throughout the app
export const supabase = createClientComponentClient<Database>();
