import React from "react";
import { useCurrentUser } from "@/components/api/useAuth";
import { hasAnyPermission } from "@/components/lib/permissions";

/**
 * Guard Component - Renders children only if user has required permissions
 * 
 * Usage:
 * <Guard permissions={['admin']}>
 *   <Button>Admin Only Action</Button>
 * </Guard>
 * 
 * @param {Array<string>} permissions - Required permissions (e.g., ['admin', 'editor'])
 * @param {React.ReactNode} children - Content to render if permission granted
 * @param {React.ReactNode} fallback - Optional content to render if permission denied
 */
export default function Guard({ permissions = [], children, fallback = null }) {
  const { data: user } = useCurrentUser();
  
  if (!user) return fallback;
  
  const hasPermission = hasAnyPermission(user, permissions);
  
  if (!hasPermission) return fallback;
  
  return <>{children}</>;
}