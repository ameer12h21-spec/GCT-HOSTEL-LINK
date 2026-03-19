import { supabase } from "./supabase";
import type { UserRole, Profile } from "./supabase";

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  
  return data as Profile | null;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function signUp(fields: {
  name: string;
  father_name: string;
  roll_number: string;
  technology: string;
  room_no: string;
  shift: "1st" | "2nd";
  hostel: "Jinnah" | "Iqbal";
  email: string;
  phone: string;
  father_phone: string;
  address: string;
  password: string;
}) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: fields.email,
    password: fields.password,
  });
  if (authError) throw authError;
  if (!authData.user) throw new Error("Signup failed");

  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    role: "student" as UserRole,
    email: fields.email,
    name: fields.name,
    father_name: fields.father_name,
    roll_number: fields.roll_number,
    technology: fields.technology,
    room_no: fields.room_no,
    shift: fields.shift,
    hostel: fields.hostel,
    phone: fields.phone,
    father_phone: fields.father_phone,
    address: fields.address,
    status: "pending",
  });
  if (profileError) throw profileError;

  return authData;
}

export function validateRollNumber(roll: string): boolean {
  return /^\d{3}[RS]\d{2,3}$/.test(roll);
}
