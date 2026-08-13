import React from 'react';

interface InitialsAvatarProps {
  name?: string | null;
  role?: string | null;
  avatarType?: 'owner' | 'manager' | 'customer';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const InitialsAvatar: React.FC<InitialsAvatarProps> = ({
  name,
  role,
  avatarType,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  // Determine avatar image path based on role or avatarType
  let avatarSrc = '/customer.png';

  if (avatarType === 'owner') {
    avatarSrc = '/owner.png';
  } else if (avatarType === 'manager') {
    avatarSrc = '/manager.png';
  } else if (avatarType === 'customer') {
    avatarSrc = '/customer.png';
  } else if (role) {
    const normalizedRole = role.toUpperCase();
    if (normalizedRole === 'OWNER') avatarSrc = '/owner.png';
    else if (normalizedRole === 'MANAGER') avatarSrc = '/manager.png';
    else avatarSrc = '/customer.png';
  } else if (name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('owner')) avatarSrc = '/owner.png';
    else if (lowerName.includes('manager')) avatarSrc = '/manager.png';
    else avatarSrc = '/customer.png';
  }

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 shadow-xs border border-[#E4E4E7] bg-[#18181B] ${sizeClasses[size]} ${className}`}
      title={name || 'User Avatar'}
    >
      <img
        src={avatarSrc}
        alt={name || 'User Avatar'}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/avatar.svg';
        }}
      />
    </div>
  );
};


