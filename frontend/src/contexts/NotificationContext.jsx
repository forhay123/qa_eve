import React, { createContext, useState, useEffect } from 'react';

const getToken = () => localStorage.getItem('token');
const BASE_URL = 'http://localhost:8000'; // Update this if deploying

export const NotificationContext = createContext({
  notifications: {},
  clearGroupNotification: () => {},
  hasAnyNotifications: false,
  setActiveGroupId: () => {},
});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState({});
  const [activeGroupId, setActiveGroupId] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      console.log('🚫 No token found. Skipping notification WebSocket.');
      return;
    }

    const wsUrl = `${BASE_URL.replace(/^http/, 'ws')}/chat/ws/notifications?token=${token}`;
    console.log(`🌐 Connecting to Notification WS at ${wsUrl}`);
    const socket = new WebSocket(wsUrl);

    let pingInterval = null;

    socket.onopen = () => {
      console.log('🔔 Notification WebSocket connected');

      // Send a ping every 30s to keep connection alive
      pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send("ping");
        }
      }, 30000);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📩 Notification WS message received:', data);

        setNotifications((prev) => {
          const updated = { ...prev };

          if (data.type === 'new_message_alert') {
            console.log(`🚨 Received new_message_alert for group ${data.group_id}`);
            if (!updated[data.group_id]) updated[data.group_id] = {};
            if (data.group_id !== activeGroupId) {
              updated[data.group_id].hasMessage = true;
            }
          }

          else if (data.type === 'notification') {
            if (!updated[data.group_id]) updated[data.group_id] = {};

            if (data.event === 'new_poll') {
              console.log(`🗳️ New poll in group ${data.group_id}: ${data.question}`);
              updated[data.group_id].hasPoll = true;
            }

            else if (data.event === 'new_message') {
              console.log(`📎 New file or message in group ${data.group_id}: ${data.message_preview}`);
              if (data.file_type) {
                updated[data.group_id].hasFile = true;
              } else {
                if (data.group_id !== activeGroupId) {
                  updated[data.group_id].hasMessage = true;
                }
              }
            }
          }

          else {
            console.log('ℹ️ Notification WS received unknown type:', data.type);
          }

          console.log('🔔 Updated notifications state:', updated);
          return updated;
        });

      } catch (error) {
        console.error('❌ Error parsing notification message:', error);
      }
    };

    socket.onerror = (err) => {
      console.error('🔥 Notification WS error:', err);
    };

    socket.onclose = (event) => {
      if (pingInterval) clearInterval(pingInterval);
      console.log(`🔕 Notification WS closed. Code: ${event.code}, Reason: ${event.reason}`);
    };

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      console.log('⚡ Closing notification WebSocket');
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [activeGroupId]);

  const clearGroupNotification = (groupId) => {
    setNotifications((prev) => {
      if (!prev[groupId]) return prev;
      console.log(`🔕 Clearing notifications for group ${groupId}`);
      const updated = { ...prev };
      delete updated[groupId];
      return updated;
    });
  };

  const hasAnyNotifications = Object.values(notifications).some((group) =>
    group?.hasMessage || group?.hasPoll || group?.hasFile
  );

  return (
    <NotificationContext.Provider value={{
      notifications,
      clearGroupNotification,
      hasAnyNotifications,
      setActiveGroupId,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
