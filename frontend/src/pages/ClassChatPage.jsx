import React, { useEffect, useState, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatBox } from '../components/ChatBox';
import { fetchChatGroups } from '../services/messaging';
import { NotificationContext } from '../contexts/NotificationContext';

export const ClassChatPage = () => {
  const { notifications, clearGroupNotification, setActiveGroupId } = useContext(NotificationContext);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);

    const loadGroups = async () => {
      try {
        const res = await fetchChatGroups();
        setGroups(res);
        if (res.length > 0) {
          setSelectedGroup(res[0]);
          setActiveGroupId(res[0].id);
          clearGroupNotification(res[0].id);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to load chat groups');
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, []);

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setActiveGroupId(group.id);
    clearGroupNotification(group.id);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-background min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-center text-lg">Loading chat groups...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background text-foreground min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center lg:text-left">Class Chat Room</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[80vh]">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col shadow-md rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">My Groups</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {groups.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No groups available
                    </div>
                  ) : (
                    groups.map(group => {
                      const notif = notifications?.[group.id];
                      const hasNotification = notif?.hasMessage || notif?.hasPoll || notif?.hasFile;

                      return (
                        <button
                          key={group.id}
                          onClick={() => handleGroupSelect(group)}
                          className={`w-full p-3 text-left rounded-lg transition-all text-sm font-medium 
                            border hover:bg-muted/70 relative
                            ${selectedGroup?.id === group.id ? 'bg-primary text-primary-foreground shadow-sm' : ''}
                          `}
                        >
                          <div className="font-semibold">{group.name}</div>
                          {group.level && (
                            <div className="text-xs opacity-80 mt-1">
                              {group.level} {group.department && `- ${group.department}`}
                            </div>
                          )}

                          {hasNotification && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Box */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col shadow-md rounded-2xl">
              <CardHeader className="border-b p-4">
                {selectedGroup ? (
                  <div>
                    <h2 className="text-xl font-semibold">{selectedGroup.name}</h2>
                    {selectedGroup.level && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedGroup.level} {selectedGroup.department && `- ${selectedGroup.department}`}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-lg font-medium text-muted-foreground text-center w-full">
                    Select a group to start chatting
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex-1 p-0">
                {selectedGroup ? (
                  <ChatBox groupId={selectedGroup.id} currentUser={currentUser} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <div className="text-lg font-medium mb-2">Welcome to Class Chat</div>
                      <div className="text-sm">Select a group from the sidebar to start chatting</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
