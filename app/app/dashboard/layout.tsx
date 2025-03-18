"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileText,
  Home,
  PawPrint,
  Settings,
  LogOut,
  Calendar,
  Users,
  FileBarChart2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface UserData {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
  };
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user as UserData | null);
      setIsLoading(false);
    }

    fetchUser();
  }, []);

  const navigation = [
    {
      name: "Appointments",
      icon: Calendar,
      href: "/app/dashboard/appointments",
    },
    {
      name: "Current Case",
      icon: FileText,
      href: "/app/dashboard/current-case",
    },
    {
      name: "Templates",
      icon: FileBarChart2,
      href: "/app/dashboard/templates",
    },
  ];

  // Generate user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";

    if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`;
    }

    if (user.user_metadata?.full_name) {
      const nameParts = user.user_metadata.full_name.split(" ");
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`;
      }
      return nameParts[0][0];
    }

    return user.email ? user.email[0].toUpperCase() : "U";
  };

  // Get display name
  const getDisplayName = () => {
    if (!user) return "User";

    if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }

    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }

    return user.email?.split("@")[0] || "User";
  };

  return (
    <div className={`flex h-screen ${pathname === '/app/dashboard/appointments' || pathname === '/app/dashboard/current-case' ? 'bg-white' : 'bg-background'}`}>
      {/* Sidebar */}
      <div className="flex w-64 flex-col border-r border-secondary-foreground/10 bg-secondary backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-secondary-foreground/10 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <PawPrint className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-medium text-secondary-foreground">ClinicConnect</h1>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Button
                key={item.name}
                variant="ghost"
                className={`w-full justify-start gap-3 rounded-lg py-2.5 text-secondary-foreground/90 hover:bg-secondary/80 hover:text-secondary-foreground ${
                  isActive ? "bg-secondary/80 font-medium text-secondary-foreground" : ""
                }`}
                asChild
              >
                <Link href={item.href}>
                  <item.icon
                    className={`h-5 w-5 ${isActive ? "text-accent" : "text-secondary-foreground/90"}`}
                  />
                  <span>{item.name}</span>
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="border-t border-secondary-foreground/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-secondary-foreground/10">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {isLoading ? "..." : getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-secondary-foreground">
                {isLoading ? "Loading..." : getDisplayName()}
              </p>
              <p className="text-xs text-secondary-foreground/80">{user?.email || ""}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-secondary-foreground/80 hover:bg-secondary/80 hover:text-secondary-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Logout Button */}
          <form action={signOutAction} className="mt-3">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-3 rounded-lg py-2.5 text-secondary-foreground/90 hover:bg-secondary/80 hover:text-secondary-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 overflow-auto ${pathname === '/app/dashboard/appointments' || pathname === '/app/dashboard/current-case' ? 'bg-white' : 'bg-background'}`}>
        <style jsx global>{`
          /* Light theme styles for Current Case page */
          .light {
            --card-bg: #FFFFFF;
            --bg-subtle: #F8F9FA;
            --text-main: #1A202C;
            --text-muted: #718096;
            --border-color: #E2E8F0;
            --primary: #2A9D8F;
            --primary-hover: #2A9D8F99;
            --secondary: #264653;
            --accent: #E9C46A;
            --success: #38A169;
            --destructive: #E76F51;
          }
          
          /* Override styles for Current Case page */
          .current-case-page .bg-blue-950\\/40,
          .current-case-page .bg-blue-900\\/30,
          .current-case-page .bg-blue-900\\/20 {
            background-color: var(--card-bg) !important;
            backdrop-filter: none !important;
          }
          
          .current-case-page .border-blue-800\\/30,
          .current-case-page .border-blue-800\\/20,
          .current-case-page .border-blue-700\\/30 {
            border-color: var(--border-color) !important;
          }
          
          .current-case-page .text-blue-50,
          .current-case-page .text-white {
            color: var(--text-main) !important;
          }
          
          .current-case-page .text-blue-300,
          .current-case-page .text-blue-200 {
            color: var(--text-muted) !important;
          }
          
          .current-case-page .bg-blue-600,
          .current-case-page .bg-primary {
            background-color: var(--primary) !important;
          }
          
          .current-case-page .hover\\:bg-blue-700:hover {
            background-color: var(--primary-hover) !important;
          }
          
          .current-case-page .shadow-blue-950\\/30 {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          }
          
          .current-case-page .rounded-2xl {
            border-radius: 0.5rem !important;
          }
        `}</style>
        {children}
      </div>
    </div>
  );
}
