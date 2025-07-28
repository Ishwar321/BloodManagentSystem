// Professional Admin Theme System for Blood Bank Management
export const AdminTheme = {
  colors: {
    primary: '#1e3a8a',
    secondary: '#64748b',
    success: '#059669',
    danger: '#dc2626',
    warning: '#d97706',
    info: '#0284c7',
    light: '#f8fafc',
    dark: '#1e293b',
    white: '#ffffff',
    muted: '#64748b',
    border: '#e2e8f0',
    cardBg: '#ffffff',
    accent: '#dc2626',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%)',
    secondary: 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #475569 100%)',
    organization: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%)',
    hospital: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e3a8a 100%)',
    donor: 'linear-gradient(135deg, #f093fb 0%, #f84bf0 50%, #c026d3 100%)',
    success: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%)',
    danger: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #b91c1c 100%)',
    warning: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #b45309 100%)',
    info: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #0369a1 100%)',
  },
  shadows: {
    small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    large: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    cardHover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px',
    xl: '20px',
  }
};

export const AdminGlobalStyles = `
  /* Global Admin Theme Styles */
  .admin-theme {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: ${AdminTheme.colors.light};
    min-height: 100vh;
  }

  /* Container Styles */
  .admin-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Professional Header Styles */
  .admin-header {
    background: ${AdminTheme.gradients.primary};
    color: white;
    border-radius: ${AdminTheme.borderRadius.large};
    padding: 3rem 2rem;
    margin-bottom: 2rem;
    position: relative;
    overflow: hidden;
    box-shadow: ${AdminTheme.shadows.large};
  }

  .admin-header.organization-header {
    background: ${AdminTheme.gradients.organization};
  }

  .admin-header.hospital-header {
    background: ${AdminTheme.gradients.hospital};
  }

  .admin-header.donor-header {
    background: ${AdminTheme.gradients.donor};
  }

  .admin-header::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 150px;
    height: 150px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: float 6s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  /* Statistics Cards */
  .admin-stat-card {
    background: white;
    border-radius: ${AdminTheme.borderRadius.large};
    padding: 1.5rem;
    box-shadow: ${AdminTheme.shadows.card};
    border: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .admin-stat-card:hover {
    transform: translateY(-4px);
    box-shadow: ${AdminTheme.shadows.cardHover};
  }

  .admin-stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${AdminTheme.colors.primary};
    transition: all 0.3s ease;
  }

  .admin-stat-card:hover::before {
    width: 6px;
  }

  .admin-stat-icon {
    width: 60px;
    height: 60px;
    border-radius: ${AdminTheme.borderRadius.large};
    background: ${AdminTheme.gradients.primary};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .organization-icon-gradient {
    background: ${AdminTheme.gradients.organization};
    color: white;
    border-radius: ${AdminTheme.borderRadius.medium};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hospital-icon-gradient {
    background: ${AdminTheme.gradients.hospital};
    color: white;
    border-radius: ${AdminTheme.borderRadius.medium};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .donor-icon-gradient {
    background: ${AdminTheme.gradients.donor};
    color: white;
    border-radius: ${AdminTheme.borderRadius.medium};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Search Section Styles */
  .admin-search-section {
    background: white;
    border-radius: ${AdminTheme.borderRadius.large};
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: ${AdminTheme.shadows.card};
    border: 1px solid ${AdminTheme.colors.border};
  }

  .admin-form-label {
    font-weight: 600;
    color: ${AdminTheme.colors.dark};
    margin-bottom: 0.5rem;
    display: block;
    font-size: 0.875rem;
  }

  .admin-form-control {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid ${AdminTheme.colors.border};
    border-radius: ${AdminTheme.borderRadius.medium};
    font-size: 0.875rem;
    transition: all 0.2s ease;
    background: white;
  }

  .admin-form-control:focus {
    outline: none;
    border-color: ${AdminTheme.colors.primary};
    box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
  }

  .organization-search-input:focus {
    border-color: #059669;
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
  }

  .hospital-search-input:focus {
    border-color: #1e40af;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }

  .donor-search-input:focus {
    border-color: #c026d3;
    box-shadow: 0 0 0 3px rgba(192, 38, 211, 0.1);
  }

  /* Button Styles */
  .admin-btn {
    padding: 0.75rem 1.5rem;
    border-radius: ${AdminTheme.borderRadius.medium};
    font-weight: 600;
    font-size: 0.875rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
  }

  .admin-btn-primary {
    background: ${AdminTheme.gradients.primary};
    color: white;
  }

  .admin-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: ${AdminTheme.shadows.medium};
  }

  .admin-btn-outline {
    background: transparent;
    color: ${AdminTheme.colors.primary};
    border: 2px solid ${AdminTheme.colors.primary};
  }

  .admin-btn-outline:hover {
    background: ${AdminTheme.colors.primary};
    color: white;
  }

  .admin-btn-sm {
    padding: 0.5rem;
    border-radius: ${AdminTheme.borderRadius.small};
    font-size: 0.75rem;
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 0 0.25rem;
  }

  .admin-btn-sm.admin-btn-info {
    background: ${AdminTheme.colors.info};
    color: white;
  }

  .admin-btn-sm.admin-btn-primary {
    background: ${AdminTheme.colors.primary};
    color: white;
  }

  .admin-btn-sm.admin-btn-danger {
    background: ${AdminTheme.colors.danger};
    color: white;
  }

  .admin-btn-sm:hover {
    transform: translateY(-1px);
    box-shadow: ${AdminTheme.shadows.small};
  }

  /* Table Styles */
  .admin-table-card {
    background: white;
    border-radius: ${AdminTheme.borderRadius.large};
    box-shadow: ${AdminTheme.shadows.card};
    border: 1px solid ${AdminTheme.colors.border};
    overflow: hidden;
  }

  .admin-table-header {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    padding: 1.5rem 2rem;
    border-bottom: 1px solid ${AdminTheme.colors.border};
  }

  .admin-table-responsive {
    overflow-x: auto;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .admin-table th {
    background: #f8fafc;
    padding: 1rem 1.5rem;
    text-align: left;
    font-weight: 600;
    color: ${AdminTheme.colors.dark};
    border-bottom: 1px solid ${AdminTheme.colors.border};
    font-size: 0.875rem;
  }

  .admin-table td {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
  }

  .admin-table tbody tr:hover {
    background-color: #f8fafc;
  }

  .admin-table-user {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .admin-table-avatar {
    width: 48px;
    height: 48px;
    border-radius: ${AdminTheme.borderRadius.medium};
    background: ${AdminTheme.gradients.primary};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .admin-table-name {
    font-weight: 600;
    color: ${AdminTheme.colors.dark};
    margin-bottom: 0.25rem;
  }

  .admin-table-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .admin-contact-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .admin-contact-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .admin-contact-item i {
    width: 16px;
    flex-shrink: 0;
  }

  .admin-date-info {
    text-align: left;
  }

  .admin-date-primary {
    font-weight: 600;
    color: ${AdminTheme.colors.dark};
    margin-bottom: 0.25rem;
  }

  .admin-date-secondary {
    color: ${AdminTheme.colors.muted};
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
  }

  .admin-date-relative {
    color: ${AdminTheme.colors.primary};
    font-size: 0.8rem;
    font-weight: 500;
  }

  .admin-action-buttons {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
  }

  /* Badge Styles */
  .admin-badge {
    padding: 0.25rem 0.75rem;
    border-radius: ${AdminTheme.borderRadius.small};
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .admin-badge-primary {
    background: rgba(30, 58, 138, 0.1);
    color: ${AdminTheme.colors.primary};
  }

  .admin-badge-success {
    background: rgba(5, 150, 105, 0.1);
    color: ${AdminTheme.colors.success};
  }

  .admin-badge-info {
    background: rgba(2, 132, 199, 0.1);
    color: ${AdminTheme.colors.info};
  }

  .admin-badge-warning {
    background: rgba(217, 119, 6, 0.1);
    color: ${AdminTheme.colors.warning};
  }

  .admin-badge-danger {
    background: rgba(220, 38, 38, 0.1);
    color: ${AdminTheme.colors.danger};
  }

  /* Loading and Empty States */
  .admin-loading {
    text-align: center;
    padding: 4rem 2rem;
    color: ${AdminTheme.colors.muted};
  }

  .admin-loading i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: ${AdminTheme.colors.primary};
  }

  .admin-no-data {
    text-align: center;
    padding: 4rem 2rem;
    color: ${AdminTheme.colors.muted};
  }

  .admin-no-data i {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    color: ${AdminTheme.colors.muted};
  }

  .admin-no-data h4 {
    color: ${AdminTheme.colors.dark};
    margin-bottom: 1rem;
  }

  /* Modal Styles */
  .admin-modal .modal-content {
    border-radius: ${AdminTheme.borderRadius.large};
    border: none;
    box-shadow: ${AdminTheme.shadows.xl};
  }

  .admin-modal .modal-header {
    background: ${AdminTheme.gradients.primary};
    color: white;
    border-radius: ${AdminTheme.borderRadius.large} ${AdminTheme.borderRadius.large} 0 0;
    border-bottom: none;
    padding: 1.5rem 2rem;
  }

  .admin-modal .modal-body {
    padding: 2rem;
  }

  .admin-modal .modal-footer {
    padding: 1.5rem 2rem;
    border-top: 1px solid ${AdminTheme.colors.border};
    background: #f8fafc;
    border-radius: 0 0 ${AdminTheme.borderRadius.large} ${AdminTheme.borderRadius.large};
  }

  .admin-form-group {
    margin-bottom: 1.5rem;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .admin-container {
      padding: 1rem;
    }

    .admin-header {
      padding: 2rem 1.5rem;
      text-align: center;
    }

    .admin-search-section {
      padding: 1.5rem;
    }

    .admin-table th,
    .admin-table td {
      padding: 0.75rem;
    }

    .admin-table-responsive {
      font-size: 0.875rem;
    }

    .admin-contact-item {
      font-size: 0.8rem;
    }
  }
`;

// Individual page theme exports for consistency
export const OrganizationTheme = {
  ...AdminTheme,
  pageGradient: AdminTheme.gradients.organization,
  pageColor: '#11998e',
};

export const HospitalTheme = {
  ...AdminTheme,
  pageGradient: AdminTheme.gradients.hospital,
  pageColor: '#667eea',
};

export const DonorTheme = {
  ...AdminTheme,
  pageGradient: AdminTheme.gradients.donor,
  pageColor: '#f093fb',
};
