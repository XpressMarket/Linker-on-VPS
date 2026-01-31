// Afia Abia\frontend\src\components\RoleBadge.tsx

import React from 'react';

// ✅ FIXED: Define exact role types
type UserRole = 'platform_owner' | 'executive_admin' | 'admin' | 'user';

interface RoleBadgeProps {
  role: UserRole | string; // Allow string for flexibility but type-check internally
}

interface BadgeConfig {
  label: string;
  color: string;
  hidden?: boolean;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  // ✅ FIXED: Proper typing with index signature
  const badges: Record<UserRole, BadgeConfig> = {
    platform_owner: { 
      label: 'Root', 
      color: 'from-yellow-500 to-orange-500', 
      hidden: true 
    },
    executive_admin: { 
      label: 'Executive Admin', 
      color: 'from-purple-500 to-purple-600' 
    },
    admin: { 
      label: 'Admin', 
      color: 'from-blue-500 to-blue-600' 
    },
    user: { 
      label: 'Member', 
      color: 'from-gray-400 to-gray-500' 
    }
  };
  
  // ✅ FIXED: Type-safe access with fallback
  const badge = badges[role as UserRole] || badges.user;
  
  // Hide Platform Owner from UI
  if (badge.hidden) return null;
  
  return (
    <span 
      className={`px-2 py-1 text-xs font-semibold text-white rounded bg-gradient-to-r ${badge.color}`}
    >
      {badge.label}
    </span>
  );
}

// ✅ BONUS: Export role color helper
export function getRoleColor(role: UserRole | string): string {
  const colors: Record<UserRole, string> = {
    platform_owner: 'from-yellow-500 to-orange-500',
    executive_admin: 'from-purple-500 to-purple-600',
    admin: 'from-blue-500 to-blue-600',
    user: 'from-gray-400 to-gray-500'
  };
  
  return colors[role as UserRole] || colors.user;
}

// ✅ BONUS: Export role label helper
export function getRoleLabel(role: UserRole | string): string {
  const labels: Record<UserRole, string> = {
    platform_owner: 'Platform Owner',
    executive_admin: 'Executive Admin',
    admin: 'Admin',
    user: 'Member'
  };
  
  return labels[role as UserRole] || labels.user;
}