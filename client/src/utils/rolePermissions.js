// Role-based access control utility
export const rolePermissions = {
  admin: [
    "/admin",
    "/blood-requests", 
    "/donation-camps",
    "/donar-list",
    "/hospital-list", 
    "/org-list",
    "/notifications"
  ],
  donar: [
    "/",
    "/blood-requests",
    "/donation-camps", 
    "/notifications"
  ],
  hospital: [
    "/",
    "/blood-requests",
    "/donar",
    "/donation-camps",
    "/notifications"
  ],
  organisation: [
    "/organization-dashboard",
    "/donation-camps",
    "/events-campaigns",
    "/donor-network",
    "/hospital-partners",
    "/awareness-programs",
    "/volunteers",
    "/impact-analytics",
    "/notifications"
  ]
};

// Check if user has access to a specific route
export const hasRouteAccess = (userRole, route) => {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(route);
};

// Get accessible routes for a user role
export const getAccessibleRoutes = (userRole) => {
  return rolePermissions[userRole] || [];
};

// Role display names
export const roleDisplayNames = {
  admin: "Administrator",
  donar: "Donor", 
  hospital: "Hospital",
  organisation: "Organization"
};
