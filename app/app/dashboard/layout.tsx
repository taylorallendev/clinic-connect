"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Home, PawPrint, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeProvider } from "next-themes";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", icon: Home, href: "/dashboard" },
    { name: "Current Case", icon: FileText, href: "/dashboard/current-case" },
    { name: "Templates", icon: FileText, href: "/dashboard/templates" },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <div className="flex w-64 flex-col border-r border-[#e2e8f0] bg-white">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0ea5e9]">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-medium text-[#0f172a]">PetScribe</h1>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Button
                key={item.name}
                variant="ghost"
                className={`w-full justify-start gap-3 rounded-lg py-2.5 text-[#64748b] hover:bg-[#f1f5f9] ${
                  isActive ? "bg-[#f1f5f9] font-medium text-[#0ea5e9]" : ""
                }`}
                asChild
              >
                <Link href={item.href}>
                  <item.icon
                    className={`h-5 w-5 ${isActive ? "text-[#0ea5e9]" : "text-[#64748b]"}`}
                  />
                  <span>{item.name}</span>
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="border-t border-[#e2e8f0] p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-[#e2e8f0]">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-[#0ea5e9] text-white">
                DR
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#0f172a]">
                Dr. Sarah Reynolds
              </p>
              <p className="text-xs text-[#64748b]">Happy Paws Clinic</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <Settings className="h-4 w-4 text-[#64748b]" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
