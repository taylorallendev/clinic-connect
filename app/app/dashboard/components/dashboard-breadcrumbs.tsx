"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

interface BreadcrumbItemData {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname();

  // Skip rendering breadcrumbs on the main dashboard page
  if (pathname === "/app/dashboard") {
    return null;
  }

  // Generate breadcrumb items from the current path
  const breadcrumbItems: BreadcrumbItemData[] = generateBreadcrumbs(pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-sm">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={`breadcrumb-${item.href}`}>
            <BreadcrumbItem>
              {item.isCurrentPage ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>
                    {index === 0 ? (
                      <span className="flex items-center">
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="sr-only">Dashboard</span>
                      </span>
                    ) : (
                      item.label
                    )}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbItems.length - 1 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItemData[] {
  // Always start with dashboard as the root
  const breadcrumbs: BreadcrumbItemData[] = [
    {
      label: "Dashboard",
      href: "/app/dashboard",
      isCurrentPage: pathname === "/app/dashboard",
    },
  ];

  // Split the pathname into segments and build the breadcrumb trail
  const segments = pathname.split("/").filter(Boolean);

  // Remove 'app' from segments if present
  const relevantSegments = segments[0] === "app" ? segments.slice(1) : segments;

  // Skip 'dashboard' as it's already included
  const pathSegments =
    relevantSegments[0] === "dashboard"
      ? relevantSegments.slice(1)
      : relevantSegments;

  let currentPath = "/app/dashboard";

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Format the segment for display (replace hyphens with spaces, capitalize)
    let label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    // Handle special cases for better readability
    if (segment === "case" && index < pathSegments.length - 1) {
      label = "Case";
    } else if (segment === "find-case") {
      label = "Find Case";
    } else if (segment === "current-case") {
      label = "Current Case";
    } else if (segment === "export-center") {
      label = "Export Center";
    }

    // For case IDs, show a shorter version
    if (
      pathSegments[index - 1] === "case" &&
      segment.length > 8 &&
      !isNaN(Number(segment))
    ) {
      label = `Case #${segment.substring(0, 8)}...`;
    }

    breadcrumbs.push({
      label,
      href: currentPath,
      isCurrentPage: currentPath === pathname,
    });
  });

  return breadcrumbs;
}
