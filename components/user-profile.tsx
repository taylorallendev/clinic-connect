"use client";

import { useUser } from "@/utils/supabase/client-hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function UserProfile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16 mt-1" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get user initials for avatar fallback
  // Supabase doesn't have firstName/lastName fields by default
  // We'll use the email or name if available
  const email = user.email || "";
  const name = user.user_metadata?.name || "";

  let initials = "";
  if (name) {
    // Extract initials from full name
    const nameParts = name.split(" ");
    initials = nameParts
      .map((part: string) => part[0])
      .join("")
      .toUpperCase();
  } else if (email) {
    // Use first letter of email
    initials = email[0].toUpperCase();
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage
          src={user.user_metadata?.avatar_url}
          alt={name || email || "User"}
        />
        <AvatarFallback>{initials || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <p className="text-sm font-medium leading-none">
          {name || email || "User"}
        </p>
        <p className="text-xs text-muted-foreground">{email || ""}</p>
      </div>
    </div>
  );
}
