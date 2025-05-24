"use client";

import * as React from "react";
import { BookOpen, Calendar, FileText, PawPrint } from "lucide-react";
import { signOut } from "@/app/actions";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";

function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
      <SidebarMenu className="gap-y-1">
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/app/dashboard/current-case">
              <Calendar />
              Current Case
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/app/dashboard/appointments">
              <BookOpen />
              Appointments
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/app/dashboard/templates">
              <FileText />
              Templates
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

// Add this interface before the DashboardSidebar component
interface DashboardSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    id: string;
    email: string | undefined;
    user_metadata: any;
  } | null;
  isLoading: boolean;
}

export function DashboardSidebar({
  user,
  isLoading,
  ...props
}: DashboardSidebarProps) {
  const { state } = useSidebar();

  const { isMobile } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      className="bg-secondary text-white"
      style={
        {
          // Explicitly set CSS variables for consistent background
          "--sidebar": "var(--secondary)",
          "--sidebar-foreground": "white",
        } as React.CSSProperties
      }
      {...props}
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2a9d8f]/20">
            <PawPrint className="h-5 w-5 text-[#2a9d8f]" />
          </div>
          {(state === "expanded" || isMobile) && (
            <h1 className="text-xl font-medium text-white">OdisAI</h1>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-2 w-full">
          {!isLoading && user?.email && (state === "expanded" || isMobile) && (
            <span className="text-sm text-white/80 flex-1">{user.email}</span>
          )}

          {(state === "expanded" || isMobile) && (
            <button
              onClick={() => signOut()}
              className="text-sm text-white/80 hover:text-white flex items-center gap-2 transition-colors"
            >
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
                className="lucide lucide-log-out"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          )}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
