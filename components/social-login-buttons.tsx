"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "./ui/button";
import { useState } from "react";

export function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <span>Connecting...</span>
      ) : (
        <>
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path
                d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z"
                fill="currentColor"
              ></path>
            </g>
          </svg>
          Sign in with Google
        </>
      )}
    </Button>
  );
}
