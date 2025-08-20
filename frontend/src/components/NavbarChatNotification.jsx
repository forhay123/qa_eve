import React, { useContext } from 'react';
import { Bell } from 'lucide-react';
import { NotificationContext } from '../contexts/NotificationContext';

export const NavbarChatNotification = () => {
  const { hasAnyNotifications } = useContext(NotificationContext);

  return (
    <div className="relative cursor-pointer">
      <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" />
      {hasAnyNotifications && (
        <>
          {/* Animated ping effect */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
          {/* Static red dot with inner white dot */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </>
      )}
    </div>
  );
};
