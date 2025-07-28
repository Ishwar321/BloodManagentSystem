// Menu for different user roles
export const donorMenu = [
  {
    name: "Inventory",
    path: "/",
    icon: "fa-solid fa-warehouse",
  },
  {
    name: "Blood Requests",
    path: "/blood-requests",
    icon: "fa-solid fa-droplet",
  },
  {
    name: "Donation Camps",
    path: "/donation-camps",
    icon: "fa-solid fa-calendar",
  },
  {
    name: "Application Status",
    path: "/application-status",
    icon: "fa-solid fa-chart-bar",
  },
];

export const hospitalMenu = [
  {
    name: "Inventory",
    path: "/",
    icon: "fa-solid fa-warehouse",
  },
  {
    name: "Blood Requests",
    path: "/blood-requests",
    icon: "fa-solid fa-droplet",
  },
  {
    name: "Donors",
    path: "/donar",
    icon: "fa-solid fa-hand-holding-medical",
  },
  {
    name: "Donation Camps",
    path: "/donation-camps",
    icon: "fa-solid fa-calendar",
  },
  {
    name: "Application Status",
    path: "/application-status",
    icon: "fa-solid fa-chart-bar",
  },
];

export const organisationMenu = [
  {
    name: "Home",
    path: "/organization-dashboard",
    icon: "fa-solid fa-home",
  },
  {
    name: "Blood Collection",
    path: "/blood-collection",
    icon: "fa-solid fa-tint",
  },
  {
    name: "Events & Campaigns",
    path: "/events-campaigns",
    icon: "fa-solid fa-bullhorn",
  },
  {
    name: "Donor Network",
    path: "/donor-network",
    icon: "fa-solid fa-users",
  },
  {
    name: "Hospital Partners",
    path: "/hospital-partners",
    icon: "fa-solid fa-handshake",
  },
  {
    name: "Application Status",
    path: "/application-status",
    icon: "fa-solid fa-chart-bar",
  },
];

export const adminMenu = [
  {
    name: "Admin Dashboard",
    path: "/admin",
    icon: "fa-solid fa-tachometer-alt",
  },
  {
    name: "Donor List",
    path: "/donar-list",
    icon: "fa-solid fa-users",
  },
  {
    name: "Hospital List",
    path: "/hospital-list",
    icon: "fa-solid fa-hospital",
  },
  {
    name: "Organization List",
    path: "/org-list",
    icon: "fa-solid fa-building",
  },
  {
    name: "Analytics Dashboard",
    path: "/analytics-dashboard",
    icon: "fa-solid fa-chart-line",
  },
  {
    name: "System Monitoring",
    path: "/system-monitoring",
    icon: "fa-solid fa-desktop",
  },
  {
    name: "Application Status",
    path: "/application-status",
    icon: "fa-solid fa-chart-bar",
  },
];

// Default export for backward compatibility
export const userMenu = donorMenu;
