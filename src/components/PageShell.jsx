import React from "react";
import { cn } from "@/lib/utils";

/**
 * Vereinfachte PageShell für AppShell Layout
 * Topbar + Content Area
 */
export default function PageShell({ 
  title, 
  subtitle, 
  actions, 
  toolbar,
  children,
  className 
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Topbar */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {actions}
          </div>
        )}
      </header>

      {/* Optional Toolbar */}
      {toolbar && (
        <div className="border-b border-border bg-card px-6 py-3 flex-shrink-0">
          {toolbar}
        </div>
      )}

      {/* Scrollable Content */}
      <div className={cn("flex-1 overflow-y-auto min-h-0", className)}>
        {children}
      </div>
    </div>
  );
}