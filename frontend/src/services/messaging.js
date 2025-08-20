import { BASE_URL, getToken } from './config';
import { fetchWithAuth } from './utils';

/**
 * --------------------
 * Group Management
 * --------------------
 */

export const createChatGroup = async (groupData) => {
  return await fetchWithAuth('/chat/groups', 'POST', groupData);
};

export const fetchChatGroups = async () => {
  return await fetchWithAuth('/chat/groups');
};

/**
 * --------------------
 * Message Management (Persistent)
 * --------------------
 */

// Fetch all messages for a group (DB, not WebSocket-only)
export const fetchGroupMessages = async (groupId) => {
  return await fetchWithAuth(`/chat/groups/${groupId}/messages`);
};

// Keep REST send for fallback (optional but useful in some cases)
export const sendGroupMessage = async ({ content, group_id, file_url = null, file_type = null }) => {
  if (!content && !file_url) {
    throw new Error("Cannot send empty message or file");
  }

  const body = {};
  if (content) body.content = content;
  if (file_url) body.file_url = file_url;
  if (file_type) body.file_type = file_type;

  return await fetchWithAuth(`/chat/groups/${group_id}/messages`, 'POST', body);
};

/**
 * --------------------
 * Poll Management
 * --------------------
 */

export const createPoll = async (pollData) => {
  return await fetchWithAuth('/chat/polls', 'POST', pollData);
};

export const votePoll = async (voteData) => {
  return await fetchWithAuth('/chat/polls/vote', 'POST', voteData);
};




export const fetchTeachers = async () => {
  return await fetchWithAuth('/teachers');
};

export const fetchStudentsByClass = async (level, department = '') => {
  const params = new URLSearchParams({ level });
  if (department) params.append('department', department);
  return await fetchWithAuth(`/students/by-class?${params}`);
};

export const fetchAllStudents = async () => {
  return await fetchWithAuth('/students');
};

export const fetchUsersByRole = async (role) => {
  return await fetchWithAuth(`/users/by-role?role=${role}`);
};


export const fetchAllUsers = async () => {
  return await fetchWithAuth(`/users`);
};



/**
 * --------------------
 * Class Management
 * --------------------
 */

export const fetchClasses = async () => {
  return await fetchWithAuth('/classes');
};

export const fetchStudentsByMultipleClasses = async (classFilters) => {
  return await fetchWithAuth('/students/by-multiple-classes', 'POST', { class_filters: classFilters });
};


export const fetchGroupMembers = async (groupId) => {
  return await fetchWithAuth(`/chat/groups/${groupId}/members`);
};


export const addGroupMember = async (groupId, studentIds = [], teacherIds = []) => {
  return await fetchWithAuth(`/chat/groups/${groupId}/add-members`, 'POST', {
    student_ids: studentIds,
    teacher_ids: teacherIds
  });
};


export const removeGroupMember = async (groupId, userId) => {
  return await fetchWithAuth(`/chat/groups/${groupId}/remove-member/${userId}`, 'DELETE');
};


export const blockGroupMember = async (groupId, userId) => {
  return await fetchWithAuth(`/chat/groups/${groupId}/block/${userId}`, 'POST');
};

export const unblockGroupMember = async (groupId, userId) => {
  return await fetchWithAuth(`/chat/groups/${groupId}/unblock/${userId}`, 'DELETE');
};


export const muteGroup = async (groupId, durationMinutes) => {
  return await fetchWithAuth(`/chat/groups/${groupId}/restrict`, 'POST', {
    duration_minutes: durationMinutes
  });
};



export const unmuteGroup = async (groupId) => {
  return await fetchWithAuth(`/chat/groups/${groupId}/unrestrict`, 'POST');
};


export const deleteMessage = async (messageId) => {
  return await fetchWithAuth(`/chat/messages/${messageId}`, 'DELETE');
};







/**
 * --------------------
 * File Upload
 * --------------------
 */

export const uploadChatFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return await fetchWithAuth('/files/upload', 'POST', formData);
};

/**
 * --------------------
 * WebSocket Chat Client (Real-time)
 * --------------------
 */

export class ChatSocketClient {
  constructor(groupId, onEvent) {
    this.groupId = groupId;
    this.onEvent = onEvent;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.typingTimeout = null;
  }

  connect() {
    const token = getToken();
    if (!token) {
      console.error('No token available for WebSocket connection');
      return;
    }

    const wsUrl = `${BASE_URL.replace(/^http/, 'ws')}/chat/ws/${this.groupId}?token=${token}`;
    
    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log(`📡 Connected to group ${this.groupId}`);
        this.reconnectAttempts = 0;
        this.sendPresence(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onEvent(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log(`🔌 Disconnected from group ${this.groupId}`, event.code);
        this.sendPresence(false);
        
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.connect();
          }, 2000 * this.reconnectAttempts);
        }
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000); // Normal closure
      this.socket = null;
    }
  }

  send(eventType, payload = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ type: eventType, ...payload }));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * -------------------
   * Real-time Actions
   * -------------------
   */

  sendMessage(content) {
    this.send('message', { content });
  }

  sendFile(fileUrl, fileType) {
    this.send('file', { file_url: fileUrl, file_type: fileType });
  }

  editMessage(messageId, newContent) {
    this.send('edit', { message_id: messageId, new_content: newContent });
  }

  deleteMessage(messageId) {
    this.send('delete', { message_id: messageId });
  }

  sendTyping() {
    // Clear any existing typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.send('typing');
    
    // Set a timeout to stop sending typing indicators
    this.typingTimeout = setTimeout(() => {
      // The backend will handle clearing the typing indicator after some time
    }, 1000);
  }

  sendPresence(online = true) {
    this.send('presence', { online });
  }
}
