import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';

export const GroupListItem = ({ group }) => {
  const { newMessages } = useContext(NotificationContext);
  const hasNewMessage = !!newMessages[group.id];

  return (
    <div className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer">
      <span>{group.name}</span>
      {hasNewMessage && (
        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">New</span>
      )}
    </div>
  );
};

