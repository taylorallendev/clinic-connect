"use client";

import * as React from "react";
import { BookOpen, Calendar, FileText, PawPrint } from "lucide-react";

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
import { UserButton } from "@clerk/nextjs";

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
      style={{
        // Explicitly set CSS variables for consistent background
        "--sidebar": "var(--secondary)",
        "--sidebar-foreground": "white"
      } as React.CSSProperties}
      {...props}
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2a9d8f]/20">
            <PawPrint className="h-5 w-5 text-[#2a9d8f]" />
          </div>
          {(state === "expanded" || isMobile) && (
            <h1 className="text-xl font-medium text-white">ClinicConnect</h1>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 w-full">
          <UserButton />
          {!isLoading && user?.email && (state === "expanded" || isMobile) && (
            <span className="text-sm text-white/80 flex-1">{user.email}</span>
          )}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
