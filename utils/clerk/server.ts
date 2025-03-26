import { auth } from "@clerk/nextjs/server";

export const getCurrentUserId = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  return userId;
};

export const getUserMetadata = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // In a real implementation, you would fetch user data from Clerk
  // For now, we'll just return the user ID
  return {
    id: userId,
  };
};
