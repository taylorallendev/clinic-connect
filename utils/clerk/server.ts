import { auth, currentUser } from "@clerk/nextjs/server";

export const getCurrentUserId = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  return userId;
};

export interface UserData {
  id: string;
  email: string | undefined;
  user_metadata: {
    first_name: string | null;
    last_name: string | null;
    full_name: string;
  };
}

export const getUserMetadata = async (): Promise<UserData> => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Fetch the full user object from Clerk
  const user = await currentUser();

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: userId,
    email: user.emailAddresses[0]?.emailAddress,
    user_metadata: {
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    },
  };
};
