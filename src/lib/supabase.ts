import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration is missing.');
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Example: Add a utility function for fetching user data
export const getUserById = async (userId: string) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user data:', error.message);
        return null;
    }

    return data;
};
