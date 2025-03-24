"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const firstName = formData.get("firstName")?.toString();
  const lastName = formData.get("lastName")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required"
    );
  }

  if (!firstName || !lastName) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "First name and last name are required"
    );
  }

  // Sign up the user with metadata
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      },
    },
  });

  if (signUpError) {
    console.error(signUpError.code + " " + signUpError.message);
    return encodedRedirect(
      "error",
      "/sign-up",
      signUpError.message,
      signUpError.code
    );
  }

  // Immediately sign in the user after successful sign-up
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error(signInError.code + " " + signInError.message);
    return encodedRedirect(
      "error",
      "/sign-up",
      signInError.message,
      signInError.code
    );
  }

  // Redirect to dashboard after successful sign-up and sign-in
  return redirect("/app/dashboard");
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  // Basic validation
  if (!email || !password) {
    console.error("Sign-in attempt with missing credentials");
    return encodedRedirect(
      "error",
      "/sign-in",
      "Email and password are required"
    );
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log detailed error information
      console.error(`Authentication error: [${error.code}] ${error.message}`);

      // Provide user-friendly error messages based on error code
      let userMessage = error.message;
      let errorCode = error.code;

      if (error.code === "invalid_credentials") {
        userMessage = "Invalid email or password. Please try again.";
      } else if (error.code === "user_not_found") {
        userMessage = "No account found with this email address.";
      } else if (error.code === "too_many_attempts") {
        userMessage = "Too many login attempts. Please try again later.";
      }

      return encodedRedirect("error", "/sign-in", userMessage, errorCode);
    }

    console.log(`User successfully signed in: ${email}`);
    return redirect("/app/dashboard");
  } catch (unexpectedError) {
    // Handle unexpected errors
    console.error("Unexpected authentication error:", unexpectedError);
    return encodedRedirect(
      "error",
      "/sign-in",
      "An unexpected error occurred. Please try again."
    );
  }
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/app/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/app/reset-password",
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect("error", "/app/reset-password", "Passwords do not match");
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect("error", "/app/reset-password", "Password update failed");
  }

  encodedRedirect("success", "/app/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
