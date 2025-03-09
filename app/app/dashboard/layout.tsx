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
    { name: "Dashboard", icon: Home, href: "/app/dashboard" },
    {
      name: "Appointments",
      icon: Calendar,
      href: "/app/dashboard/appointments",
    },
    { name: "Patients", icon: Users, href: "/app/dashboard/patients" },
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
    <div className="flex h-screen bg-gradient-to-br from-blue-950 to-indigo-950">
      {/* Sidebar */}
      <div className="flex w-64 flex-col border-r border-blue-800/30 bg-blue-950/60 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-blue-800/30 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-medium text-blue-50">ClinicConnect</h1>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Button
                key={item.name}
                variant="ghost"
                className={`w-full justify-start gap-3 rounded-lg py-2.5 text-blue-300 hover:bg-blue-800/30 ${
                  isActive ? "bg-blue-800/40 font-medium text-blue-50" : ""
                }`}
                asChild
              >
                <Link href={item.href}>
                  <item.icon
                    className={`h-5 w-5 ${isActive ? "text-blue-50" : "text-blue-300"}`}
                  />
                  <span>{item.name}</span>
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="border-t border-blue-800/30 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-blue-700/30">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-blue-700 text-white">
                {isLoading ? "..." : getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-50">
                {isLoading ? "Loading..." : getDisplayName()}
              </p>
              <p className="text-xs text-blue-300">{user?.email || ""}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-blue-300 hover:bg-blue-800/30 hover:text-blue-50"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Logout Button */}
          <form action={signOutAction} className="mt-3">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-3 rounded-lg py-2.5 text-blue-300 hover:bg-blue-800/30"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
