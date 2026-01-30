import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Mail,
  FileText,
  LayoutTemplate,
  Settings,
  FolderOpen,
  Tags,
  AlertTriangle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/**
 * AppShell mit schmaler Icon-Rail-Navigation (64px) + collapsible
 */
export default function AppShell({ children, currentPageName }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.app_role === 'admin' || user?.role === 'admin';

  const navItems = [
    { name: "Composer", page: "Composer", icon: Mail },
    { name: "Snippets", page: "Snippets", icon: FileText },
    { name: "Templates", page: "Templates", icon: LayoutTemplate },
    { name: "Entwürfe", page: "Drafts", icon: FolderOpen },
  ];

  const adminItems = [
    { name: "Kategorien", page: "Categories", icon: FolderOpen },
    { name: "Tags", page: "TagsManager", icon: Tags },
    { name: "Fehlerbilder", page: "Cases", icon: AlertTriangle },
  ];

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Icon Rail Sidebar */}
      <aside
        className={cn(
          "relative h-full bg-card border-r border-border transition-all duration-300 flex flex-col",
          sidebarExpanded ? "w-56" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="h-16 border-b border-border flex items-center justify-center px-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Mail className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-colors group",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                title={!sidebarExpanded ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarExpanded && (
                  <span className="text-sm font-medium truncate">{item.name}</span>
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="h-px bg-border mx-4 my-2" />
              {adminItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    title={!sidebarExpanded ? item.name : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarExpanded && (
                      <span className="text-sm font-medium truncate">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Expand/Collapse Button */}
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
          >
            {sidebarExpanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User */}
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8 border border-border flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {sidebarExpanded && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {user?.full_name || 'Benutzer'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {user?.app_role || user?.role || 'user'}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("Settings")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Einstellungen
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}