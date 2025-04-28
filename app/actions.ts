"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Authentication actions for Supabase Auth
 * These functions are used to handle authentication flows
 */

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const searchParams = new URLSearchParams();
    searchParams.set("error", error.message);
    return redirect(`/sign-in?${searchParams.toString()}`);
  }

  redirect("/app/dashboard/current-case");
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    const searchParams = new URLSearchParams();
    searchParams.set("error", error.message);
    return redirect(`/sign-up?${searchParams.toString()}`);
  }

  const searchParams = new URLSearchParams();
  searchParams.set("message", "Check your email for the confirmation link");
  return redirect(`/sign-up?${searchParams.toString()}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/reset-password`,
  });

  if (error) {
    const searchParams = new URLSearchParams();
    searchParams.set("error", error.message);
    return redirect(`/forgot-password?${searchParams.toString()}`);
  }

  const searchParams = new URLSearchParams();
  searchParams.set("message", "Check your email for the password reset link");
  return redirect(`/forgot-password?${searchParams.toString()}`);
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    const searchParams = new URLSearchParams();
    searchParams.set("error", error.message);
    return redirect(`/reset-password?${searchParams.toString()}`);
  }

  const searchParams = new URLSearchParams();
  searchParams.set("message", "Password updated successfully");
  return redirect(`/sign-in?${searchParams.toString()}`);
}