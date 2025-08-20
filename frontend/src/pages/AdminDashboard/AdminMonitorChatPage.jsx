import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, Eye, Users, MessageCircle, Clock, AlertTriangle, UserPlus, UserMinus, Ban, ShieldCheck, Volume, VolumeX, FileText } from 'lucide-react';
import { 
  fetchChatGroups, 
  fetchGroupMessages, 
  fetchGroupMembers,
  addGroupMember,
  removeGroupMember,
  blockGroupMember,
  unblockGroupMember,
  muteGroup,
  unmuteGroup,
  deleteMessage,
  fetchAllUsers
} from '@/services/messaging';

export default function AdminMonitorChatPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [messageFilter, setMessageFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [senderFilter, setSenderFilter] = useState('');
  
  // Modal states
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [isMuteGroupOpen, setIsMuteGroupOpen] = useState(false);
  const [muteMinutes, setMuteMinutes] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);

  // Add countdown timer state
  const [countdownTimers, setCountdownTimers] = useState({});

  useEffect(() => {
    loadGroups();
    loadAllUsers();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, messageFilter, dateFilter, fileTypeFilter, senderFilter]);

  // Add countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {};
      groups.forEach(group => {
        const remaining = getMuteTimeRemaining(group);
        if (remaining) {
          newTimers[group.id] = remaining;
        }
      });
      setCountdownTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [groups]);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const groupData = await fetchChatGroups();
      setGroups(groupData);
    } catch (error) {
      console.error('Failed to load groups:', error);
      toast.error('Failed to load chat groups');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const users = await fetchAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadMessages = async (groupId) => {
    try {
      const messageData = await fetchGroupMessages(groupId);
      setMessages(messageData);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const loadGroupMembers = async (groupId) => {
    try {
      const members = await fetchGroupMembers(groupId);
      setGroupMembers(members);
    } catch (error) {
      console.error('Failed to load group members:', error);
      toast.error('Failed to load group members');
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    loadMessages(group.id);
    loadGroupMembers(group.id);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await deleteMessage(messageId);
      toast.success('Message deleted successfully');
      loadMessages(selectedGroup.id);
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleAddMember = async (userId) => {
    try {
      // Determine if the user is a student or teacher based on role
      const targetUser = allUsers.find(u => u.id === userId);
      if (!targetUser) {
        toast.error('User not found');
        return;
      }

      if (targetUser.role === 'student') {
        await addGroupMember(selectedGroup.id, [userId], []);
      } else if (targetUser.role === 'teacher') {
        await addGroupMember(selectedGroup.id, [], [userId]);
      }

      toast.success('Member added successfully');
      loadGroupMembers(selectedGroup.id);
    } catch (error) {
      console.error('Failed to add member:', error);
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await removeGroupMember(selectedGroup.id, userId);
      toast.success('Member removed successfully');
      loadGroupMembers(selectedGroup.id);
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleBlockMember = async (userId) => {
    if (!confirm('Are you sure you want to block this member?')) return;

    try {
      await blockGroupMember(selectedGroup.id, userId);
      toast.success('Member blocked successfully');
      loadGroupMembers(selectedGroup.id);
    } catch (error) {
      console.error('Failed to block member:', error);
      toast.error('Failed to block member');
    }
  };

  const handleUnblockMember = async (userId) => {
    if (!confirm('Are you sure you want to unblock this member?')) return;

    try {
      await unblockGroupMember(selectedGroup.id, userId);
      toast.success('Member unblocked successfully');
      loadGroupMembers(selectedGroup.id);
    } catch (error) {
      console.error('Failed to unblock member:', error);
      toast.error('Failed to unblock member');
    }
  };

  const handleMuteGroup = async () => {
    if (!muteMinutes) {
      toast.error('Please specify duration in minutes');
      return;
    }

    const minutes = parseInt(muteMinutes);
    if (isNaN(minutes) || minutes < 5) {
      toast.error('Mute duration must be at least 5 minutes');
      return;
    }

    if (minutes > 10080) { // 7 days
      toast.error('Mute duration cannot exceed 7 days (10080 minutes)');
      return;
    }

    try {
      await muteGroup(selectedGroup.id, minutes);
      toast.success(`Group muted for ${minutes} minute(s)`);
      setIsMuteGroupOpen(false);
      setMuteMinutes('');

      // Refresh group list to get updated mute status
      await loadGroups();
      // Update selected group with fresh data
      const updatedGroups = await fetchChatGroups();
      const updated = updatedGroups.find(g => g.id === selectedGroup.id);
      if (updated) setSelectedGroup(updated);
    } catch (error) {
      console.error('Failed to mute group:', error);
      toast.error('Failed to mute group');
    }
  };

  const handleUnmuteGroup = async () => {
    if (!confirm('Are you sure you want to unmute this group?')) return;

    try {
      await unmuteGroup(selectedGroup.id);
      toast.success('Group unmuted successfully');

      // Refresh group list to get updated mute status
      await loadGroups();
      // Update selected group with fresh data
      const updatedGroups = await fetchChatGroups();
      const updated = updatedGroups.find(g => g.id === selectedGroup.id);
      if (updated) setSelectedGroup(updated);
    } catch (error) {
      console.error('Failed to unmute group:', error);
      toast.error('Failed to unmute group');
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    // Filter by message content
    if (messageFilter) {
      filtered = filtered.filter(msg => 
        msg.content?.toLowerCase().includes(messageFilter.toLowerCase())
      );
    }

    // Filter by date
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        return msgDate.toDateString() === filterDate.toDateString();
      });
    }

    // Filter by file type
    if (fileTypeFilter !== 'all') {
      if (fileTypeFilter === 'text') {
        filtered = filtered.filter(msg => msg.content && !msg.file_url);
      } else {
        filtered = filtered.filter(msg => msg.file_type === fileTypeFilter);
      }
    }

    // Filter by sender
    if (senderFilter) {
      filtered = filtered.filter(msg => 
        msg.sender?.full_name?.toLowerCase().includes(senderFilter.toLowerCase())
      );
    }

    setFilteredMessages(filtered);
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.level?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'class' && group.is_class_group) ||
                         (filterType === 'custom' && group.is_custom_group);
    
    return matchesSearch && matchesFilter;
  });

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getGroupType = (group) => {
    if (group.is_class_group) return 'Class Group';
    if (group.is_custom_group) return 'Custom Group';
    return 'Regular Group';
  };

  const getGroupTypeColor = (group) => {
    if (group.is_class_group) return 'bg-blue-100 text-blue-800';
    if (group.is_custom_group) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const isGroupMuted = (group) => {
    if (!group.restricted_until) return false;
    const now = Date.now();
    const muteEnd = new Date(group.restricted_until).getTime();
    return muteEnd > now;
  };

  const getMuteTimeRemaining = (group) => {
    if (!group.restricted_until) return null;

    const now = Date.now();
    const muteEnd = new Date(group.restricted_until).getTime();
    const diffMs = muteEnd - now;

    if (diffMs <= 0) return null;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const nonMembers = allUsers.filter(user => 
    !groupMembers.some(member => member.id === user.id)
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading chat groups...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Monitor Chat Groups</h1>
        <p className="text-muted-foreground">Monitor and manage all chat groups and messages</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[85vh]">
        {/* Groups List */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Chat Groups ({groups.length})
              </CardTitle>
              
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    <SelectItem value="class">Class Groups</SelectItem>
                    <SelectItem value="custom">Custom Groups</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredGroups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No groups found
                  </div>
                ) : (
                  filteredGroups.map(group => (
                    <div
                      key={group.id}
                      onClick={() => handleGroupSelect(group)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border hover:bg-muted/50 ${
                        selectedGroup?.id === group.id ? 'bg-primary text-primary-foreground' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm">{group.name}</h3>
                        <div className="flex items-center gap-1">
                          <Badge className={`text-xs ${getGroupTypeColor(group)}`}>
                            {getGroupType(group)}
                          </Badge>
                          {isGroupMuted(group) && (
                            <Badge variant="destructive" className="text-xs">
                              <VolumeX className="h-3 w-3 mr-1" />
                              Muted
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs opacity-80">
                        {group.level && (
                          <span>{group.level} {group.department && `- ${group.department}`}</span>
                        )}
                        {group.is_custom_group && <span>Mixed Classes</span>}
                      </div>
                      
                      {isGroupMuted(group) && (
                        <div className="text-xs opacity-70 mt-1 text-red-400">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {countdownTimers[group.id] || getMuteTimeRemaining(group)}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                        <MessageCircle className="h-3 w-3" />
                        <span>{group.message_count || 0} messages</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages View */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              {selectedGroup ? (
                <div>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      {selectedGroup.name}
                      {isGroupMuted(selectedGroup) && (
                        <Badge variant="destructive" className="ml-2">
                          <VolumeX className="h-3 w-3 mr-1" />
                          Muted
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Dialog open={isManageMembersOpen} onOpenChange={setIsManageMembersOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            Members
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Manage Group Members</DialogTitle>
                          </DialogHeader>
                          <Tabs defaultValue="members" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="members">Current Members</TabsTrigger>
                              <TabsTrigger value="add">Add Members</TabsTrigger>
                            </TabsList>
                            <TabsContent value="members" className="max-h-96 overflow-y-auto">
                              <div className="space-y-2">
                                {groupMembers.map(member => (
                                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <div>
                                        <p className="font-medium">{member.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{member.role}</p>
                                      </div>
                                      {member.is_blocked && (
                                        <Badge variant="destructive" className="text-xs">
                                          Blocked
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {member.is_blocked ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleUnblockMember(member.id)}
                                          className="text-green-600 hover:text-green-700"
                                        >
                                          <ShieldCheck className="h-4 w-4" />
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleBlockMember(member.id)}
                                          className="text-orange-600 hover:text-orange-700"
                                        >
                                          <Ban className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <UserMinus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
                            <TabsContent value="add" className="max-h-96 overflow-y-auto">
                              <div className="space-y-2">
                                {nonMembers.map(user => (
                                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                      <p className="font-medium">{user.full_name}</p>
                                      <p className="text-sm text-muted-foreground">{user.role}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAddMember(user.id)}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <UserPlus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                      
                      {/* Mute/Unmute Button - Always show appropriate button */}
                      {isGroupMuted(selectedGroup) ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleUnmuteGroup}
                          className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                        >
                          <Volume className="h-4 w-4 mr-2" />
                          Unmute Group
                        </Button>
                      ) : (
                        <Dialog open={isMuteGroupOpen} onOpenChange={setIsMuteGroupOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300">
                              <VolumeX className="h-4 w-4 mr-2" />
                              Mute Group
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Mute Group</DialogTitle>
                              <p className="text-sm text-muted-foreground">
                                Enter mute duration in minutes (between 5 and 10080).
                              </p>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="muteMinutes">Duration (minutes)</Label>
                                <Input
                                  id="muteMinutes"
                                  type="number"
                                  value={muteMinutes}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setMuteMinutes(
                                      isNaN(val) ? '' : Math.max(5, Math.min(10080, val)).toString()
                                    );
                                  }}
                                  placeholder="Enter minutes"
                                  min="5"
                                  max="10080"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Range: 5 minutes to 7 days (10080 minutes)
                                </p>
                              </div>
                              <Button 
                                onClick={handleMuteGroup} 
                                className="w-full"
                                disabled={!muteMinutes || Number(muteMinutes) < 5 || Number(muteMinutes) > 10080}
                              >
                                <VolumeX className="h-4 w-4 mr-2" />
                                Mute Group
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{selectedGroup.level} {selectedGroup.department && `- ${selectedGroup.department}`}</span>
                    <Badge className={getGroupTypeColor(selectedGroup)}>
                      {getGroupType(selectedGroup)}
                    </Badge>
                    {isGroupMuted(selectedGroup) && (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <Clock className="h-3 w-3 mr-1" />
                        {countdownTimers[selectedGroup.id] || getMuteTimeRemaining(selectedGroup)}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Message Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search messages..."
                        value={messageFilter}
                        onChange={(e) => setMessageFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                    
                    <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="text">Text Only</SelectItem>
                        <SelectItem value="image">Images</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      placeholder="Filter by sender..."
                      value={senderFilter}
                      onChange={(e) => setSenderFilter(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <CardTitle className="text-center text-muted-foreground">
                  Select a group to view messages
                </CardTitle>
              )}
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4">
              {selectedGroup ? (
                <div className="space-y-4 h-full">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No messages found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-lg border ${
                            message.is_deleted ? 'bg-red-50 border-red-200' : 'bg-muted/30'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {message.sender?.full_name || `User ${message.sender?.id}`}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {message.sender?.role}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(message.timestamp)}
                              </span>
                              
                              {!message.is_deleted && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="text-sm">
                            {message.is_deleted ? (
                              <span className="italic text-red-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Message deleted
                              </span>
                            ) : (
                              <div>
                                {message.content && <p className="mb-2">{message.content}</p>}
                                {message.file_url && (
                                  <div className="mt-2">
                                    {message.file_type === 'image' ? (
                                      <img
                                        src={message.file_url}
                                        alt="attachment"
                                        className="max-w-xs rounded-lg cursor-pointer"
                                        onClick={() => window.open(message.file_url, '_blank')}
                                      />
                                    ) : (
                                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                        <FileText className="h-4 w-4" />
                                        <a
                                          href={message.file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 underline text-sm"
                                        >
                                          {message.file_type} attachment
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a group to monitor its messages</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
