import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// This creates a client that automatically handles session persistence
// and reads environment variables automatically
export const supabase = createClientComponentClient();