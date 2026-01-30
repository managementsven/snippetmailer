import React from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import AppShell from "@/components/AppShell";

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <AppShell currentPageName={currentPageName}>
        {children}
      </AppShell>
    </ThemeProvider>
  );
}