/**
 * Shared types for App Shell components
 */

export interface NavItemData {
  id: string;
  label: string;
  icon: React.ReactNode;
  hasSubmenu?: boolean;
  onClick?: () => void;
}

export interface NavSectionData {
  label?: string;
  items: NavItemData[];
}






