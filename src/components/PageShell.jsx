import React from "react";
import { cn } from "@/lib/utils";

/**
 * Wiederverwendbare Page Shell mit konsistentem Layout
 * @param {string} title - Seitentitel
 * @param {string} subtitle - Optionaler Untertitel
 * @param {ReactNode} actions - Optionale Actions (Buttons) rechts oben
 * @param {ReactNode} toolbar - Optionale Toolbar unter dem Header
 * @param {ReactNode} children - Page Content
 * @param {string} className - Zusätzliche CSS Klassen für Content Area
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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            {actions}
          </div>
        )}
      </header>

      {/* Optional Toolbar */}
      {toolbar && (
        <div className="border-b border-border bg-card px-4 py-3">
          {toolbar}
        </div>
      )}

      {/* Content */}
      <div className={cn("flex-1 overflow-y-auto", className)}>
        {children}
      </div>
    </div>
  );
}