"use client";

import { signOutAction } from "@/app/actions";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

export function SidebarLogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOutAction();
  };

  return (
    <form action={signOutAction}>
      <Button
        type="submit"
        variant="ghost"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        disabled={isLoading}
        onClick={() => setIsLoading(true)}
      >
        <LogOut size={18} />
        <span>{isLoading ? "Signing out..." : "Sign out"}</span>
      </Button>
    </form>
  );
}
