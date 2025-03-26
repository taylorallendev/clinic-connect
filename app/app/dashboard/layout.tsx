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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useClerk } from "@clerk/nextjs";

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
  const { signOut } = useClerk();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user as UserData | null);
      setIsLoading(false);
    }

    fetchUser();
  }, []);

  // Check for saved sidebar state in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar:state");
    if (savedState === "collapsed") {
      setIsCollapsed(true);
    }
  }, []);

  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar:state", newState ? "collapsed" : "expanded");
  };

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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div 
        className={`flex flex-col border-r border-border bg-[#1e3a47] backdrop-blur-xl transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2a9d8f]/20">
              <PawPrint className="h-5 w-5 text-[#2a9d8f]" />
            </div>
            {!isCollapsed && (
              <h1 className="text-xl font-medium text-white">ClinicConnect</h1>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-300 hover:bg-[#2a4a5a] hover:text-white"
            onClick={toggleSidebar}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        </div>

        {!isCollapsed && (
          <>
            <nav className="flex-1 space-y-1 p-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className={`w-full justify-start gap-3 rounded-lg py-2.5 text-gray-300 hover:bg-[#2a4a5a] hover:text-white ${
                      isActive ? "bg-[#2a4a5a] font-medium text-white" : ""
                    }`}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon
                        className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-300"}`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  </Button>
                );
              })}
            </nav>

            <div className="border-t border-[#2a4a5a] p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-[#2a4a5a]">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-[#2a4a5a] text-white">
                    {isLoading ? "..." : getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {isLoading ? "Loading..." : getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-300">{user?.email || ""}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-gray-300 hover:bg-[#2a4a5a] hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => signOut()}
                className="mt-3 w-full flex items-center justify-start gap-3 rounded-lg py-2.5 px-2 text-gray-300 hover:bg-[#2a4a5a] hover:text-white"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}