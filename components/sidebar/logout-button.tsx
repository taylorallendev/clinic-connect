"use client";

import { SignOutButton, useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

export function SidebarLogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { signOut } = useClerk();

  return (
    <SignOutButton signOutCallback={() => window.location.href = "/"}>
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        disabled={isLoading}
        onClick={() => setIsLoading(true)}
      >
        <LogOut size={18} />
        <span>{isLoading ? "Signing out..." : "Sign out"}</span>
      </Button>
    </SignOutButton>
  );
}
