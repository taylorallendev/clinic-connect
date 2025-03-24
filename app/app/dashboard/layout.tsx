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
  Menu,
  X,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user as UserData | null);
      setIsLoading(false);
    }

    fetchUser();
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // Check if we're on mobile and set initial sidebar state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar toggle button */}
      <button
        type="button"
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="fixed left-4 top-4 z-40 rounded-md bg-[#1e3a47] p-2 text-white shadow-md md:hidden"
        aria-label={isMobileSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isMobileSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar overlay for mobile - closes sidebar when clicking outside */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - desktop: controlled by isSidebarOpen, mobile: controlled by isMobileSidebarOpen */}
      <div
        className={`fixed inset-0 z-30 transform transition-all duration-300 ease-in-out md:relative 
          ${isSidebarOpen ? "md:w-64" : "md:w-0"} 
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          flex flex-col border-r border-border bg-[#1e3a47] backdrop-blur-xl`}
        style={{
          width: isMobileSidebarOpen ? "85%" : isSidebarOpen ? "16rem" : "0",
        }}
      >
        <div className="flex items-center justify-between border-b border-[#2a4a5a] p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2a9d8f]/20">
              <PawPrint className="h-5 w-5 text-[#2a9d8f]" />
            </div>
            <h1 className="text-xl font-medium text-white">ClinicConnect</h1>
          </div>
          {/* Mobile close button inside sidebar header */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="text-white md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar content */}
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
          <form action={signOutAction} className="mt-3">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-3 rounded-lg py-2.5 text-gray-300 hover:bg-[#2a4a5a] hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Toggle sidebar button for desktop */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`fixed z-40 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-[#1e3a47] text-white shadow-md transition-all duration-300 ${
          isSidebarOpen ? "left-60" : "left-5"
        }`}
        aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isSidebarOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        )}
      </button>

      {/* Main Content Area - adjust padding based on sidebar state */}
      <div
        className={`flex-1 overflow-auto transition-all duration-300 ${
          isSidebarOpen ? "md:ml-0" : "md:ml-0"
        } pt-16 md:pt-0`}
      >
        {children}
      </div>
    </div>
  );
}
