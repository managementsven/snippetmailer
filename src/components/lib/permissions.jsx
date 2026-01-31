/**
 * Central Permission Service (RBAC - Role Based Access Control)
 * All permission checks should go through this service to avoid scattered logic
 */

/**
 * Check if user is an admin
 */
export function isAdmin(user) {
  if (!user) return false;
  return user.app_role === 'admin' || user.role === 'admin';
}

/**
 * Check if user is an editor (includes admin)
 */
export function isEditor(user) {
  if (!user) return false;
  return user.app_role === 'editor' || user.app_role === 'admin' || user.role === 'admin';
}

/**
 * Check if user can publish snippets
 */
export function canPublish(user) {
  return isAdmin(user);
}

/**
 * Check if user can manage (edit/delete) a specific snippet
 */
export function canManageSnippet(user, snippet) {
  if (!user) return false;
  
  // Admins can manage all snippets
  if (isAdmin(user)) return true;
  
  // Editors can only manage their own snippets
  if (isEditor(user) && snippet?.created_by === user.email) return true;
  
  return false;
}

/**
 * Check if user can create snippets
 */
export function canCreateSnippet(user) {
  return isEditor(user);
}

/**
 * Check if user can delete snippets
 */
export function canDeleteSnippet(user, snippet) {
  return isAdmin(user);
}

/**
 * Check if user can edit snippet
 */
export function canEditSnippet(user, snippet) {
  return canManageSnippet(user, snippet);
}

/**
 * Check if user can manage categories/tags/cases
 */
export function canManageCollections(user) {
  return isAdmin(user);
}

/**
 * Check if user can view drafts
 */
export function canViewDrafts(user) {
  return isEditor(user);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(user, permissions = []) {
  if (!user) return false;
  
  const permissionChecks = {
    'admin': () => isAdmin(user),
    'editor': () => isEditor(user),
    'canPublish': () => canPublish(user),
    'canManageCollections': () => canManageCollections(user),
  };
  
  return permissions.some(permission => {
    const check = permissionChecks[permission];
    return check ? check() : false;
  });
}