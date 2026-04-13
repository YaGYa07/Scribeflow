"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { useAppState } from "@/hooks/use-app-state";

export function Breadcrumbs() {
  const pathname = usePathname();
  const { files } = useAppState();

  const segments = pathname.split("/").filter(Boolean);
  const isDashboard = segments[0] === "dashboard";
  const workspaceId = segments[1];
  const fileId = segments[2];
  const activeFile = files.find((file) => file.id === fileId);

  if (!isDashboard) return null;

  const crumbs = [
    { label: "Dashboard", href: "/dashboard" },
    ...(workspaceId ?
      [
        {
          label: workspaceId === "new-workspace" ? "New Workspace" : "Workspace",
          href: `/dashboard/${workspaceId}`,
        },
      ]
    : []),
    ...(fileId ?
      [
        {
          label: activeFile?.title ?? "File",
          href: `/dashboard/${workspaceId}/${fileId}`,
        },
      ]
    : []),
  ];

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="size-4 text-muted-foreground" />}
              {isLast ?
                <span className="max-w-[24rem] truncate font-medium">{crumb.label}</span>
              : <Link
                  href={crumb.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              }
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
