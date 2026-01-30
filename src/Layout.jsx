import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import {
  Mail,
  FileText,
  LayoutTemplate,
  Settings,
  FolderOpen,
  Tags,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Star,
  LogOut,
  User,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function LayoutContent({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.app_role === 'admin' || user?.role === 'admin';
  const isEditor = user?.app_role === 'editor' || isAdmin;

  const navItems = [
    { name: "Composer", page: "Composer", icon: Mail, description: "E-Mails erstellen" },
    { name: "Snippets", page: "Snippets", icon: FileText, description: "Textbausteine" },
    { name: "Templates", page: "Templates", icon: LayoutTemplate, description: "Vorlagen" },
    { name: "Entwürfe", page: "Drafts", icon: FolderOpen, description: "Gespeicherte Entwürfe" },
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
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="ml-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-foreground">MailComposer</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-card border-r border-border z-50 transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-64",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className={cn(
          "h-16 border-b border-border flex items-center px-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-foreground text-sm">MailComposer</h1>
                <p className="text-[10px] text-muted-foreground">Support Tool</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium text-sm">{item.name}</span>
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className={cn(
                "pt-4 pb-2",
                collapsed ? "px-2" : "px-3"
              )}>
                {!collapsed && (
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Verwaltung
                  </span>
                )}
                {collapsed && <div className="h-px bg-border" />}
              </div>
              {adminItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="font-medium text-sm">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User */}
        <div className={cn(
          "p-3 border-t border-border",
          collapsed ? "flex justify-center" : ""
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 w-full p-2 rounded-xl hover:bg-accent transition-colors",
                collapsed ? "justify-center" : ""
              )}>
                <Avatar className="h-9 w-9 border-2 border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.full_name || 'Benutzer'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
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
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        collapsed ? "lg:pl-[72px]" : "lg:pl-64",
        "pt-16 lg:pt-0"
      )}>
        {children}
      </main>
    </div>
  );
}