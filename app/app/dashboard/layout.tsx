import { DashboardSidebar } from "./components/dashboard-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/server";

// Define a type for Supabase user data
interface UserData {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  let user: UserData | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (supabaseUser) {
      user = {
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        user_metadata: supabaseUser.user_metadata || {},
      };
    }
  } catch (error) {
    // Handle authentication error
    console.error("Authentication error:", error);
  }

  return (
    <SidebarProvider>
      {/* Sidebar */}
      <DashboardSidebar user={user} isLoading={false} />

      {/* Main Content Area */}
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
