export const Permissions = {
    // User permissions
    USER_READ: 'user:read',
    USER_WRITE: 'user:write',
    
    // Content permissions
    CONTENT_READ: 'content:read',
    CONTENT_WRITE: 'content:write',
    
    // Admin permissions
    ADMIN_ACCESS: 'admin:access',
    
    // System permissions
    SYSTEM_SETTINGS: 'system:settings'
  };
  
  export const Roles = {
    USER: 'user',
    ADMIN: 'admin'
    // Future roles can be added here
    // SUPER_ADMIN: 'super_admin',
    // MODERATOR: 'moderator',
    // etc.
  };
  
  // Role to permissions mapping (for future use)
  export const RolePermissions = {
    [Roles.USER]: [
      Permissions.USER_READ,
      Permissions.CONTENT_READ
    ],
    [Roles.ADMIN]: [
      Permissions.USER_READ,
      Permissions.USER_WRITE,
      Permissions.CONTENT_READ,
      Permissions.CONTENT_WRITE,
      Permissions.ADMIN_ACCESS,
      Permissions.SYSTEM_SETTINGS
    ]
  };