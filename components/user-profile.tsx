"use client";

import { useUser } from "@clerk/nextjs";
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
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
  
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
        <AvatarFallback>{initials || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <p className="text-sm font-medium leading-none">{user.fullName || "User"}</p>
        <p className="text-xs text-muted-foreground">{user.primaryEmailAddress?.emailAddress || ""}</p>
      </div>
    </div>
  );
}