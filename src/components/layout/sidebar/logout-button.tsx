"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { signOut } from "@/app/actions";
import { useRouter } from "next/navigation";

export function SidebarLogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      // The signOut function in actions.ts already handles redirection,
      // but we'll add this as a fallback
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      disabled={isLoading}
      onClick={handleSignOut}
    >
      <LogOut size={18} />
      <span>{isLoading ? "Signing out..." : "Sign out"}</span>
    </Button>
  );
}
