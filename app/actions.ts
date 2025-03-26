"use server";

// These actions are no longer needed with Clerk as it handles this UI automatically
// This file is kept for reference and for any custom server actions that may be needed
import { auth } from "@clerk/nextjs/server";

// These functions are no longer used with Clerk
// Clerk handles sign up, sign in, and password reset through its UI components

// Helper function to get the current user ID
export const getCurrentUserId = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  return userId;
};
