import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = "admin" | "teacher" | "mess_owner" | "student";

export interface Profile {
  id: string;
  role: UserRole;
  email: string;
  name: string;
  secret_key?: string;
  roll_number?: string;
  father_name?: string;
  technology?: string;
  room_no?: string;
  shift?: "1st" | "2nd";
  hostel?: "Jinnah" | "Iqbal";
  phone?: string;
  father_phone?: string;
  address?: string;
  profile_photo_url?: string;
  status: "pending" | "active" | "disabled";
  created_at: string;
}
