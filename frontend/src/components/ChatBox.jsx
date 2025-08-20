import React, { useEffect, useRef, useState, useContext } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Paperclip, Send } from 'lucide-react';
import { ChatSocketClient, fetchGroupMessages, uploadChatFile } from '../services/messaging';
import { NotificationContext } from '../contexts/NotificationContext';
import { BASE_URL } from '../services/config';

export const ChatBox = ({ groupId, currentUser }) => {
  const { clearGroupNotification } = useContext(NotificationContext);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (groupId) {
      clearGroupNotification(groupId);
    }
  }, [groupId]);

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const history = await fetchGroupMessages(groupId);
        setMessages(history);
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    socketRef.current = new ChatSocketClient(groupId, handleSocketEvent);
    socketRef.current.connect();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [groupId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSocketEvent = (data) => {
    if (data.type === 'message') {
      setMessages((prev) => {
        const existing = prev.find(msg => msg.id === data.message_id);
        if (existing) return prev;
        return [...prev, {
          id: data.message_id,
          content: data.content,
          sender: data.sender,
          timestamp: data.timestamp,
          is_deleted: false
        }];
      });
    }

    if (data.type === 'file') {
      setMessages((prev) => {
        const existing = prev.find(msg => msg.id === data.message_id);
        if (existing) return prev;
        return [...prev, {
          id: data.message_id,
          file_url: data.file_url,
          file_type: data.file_type,
          sender: data.sender,
          timestamp: data.timestamp,
          is_deleted: false
        }];
      });
    }

    if (data.type === 'edit') {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.message_id ? { ...msg, content: data.new_content } : msg
        )
      );
    }

    if (data.type === 'delete') {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.message_id ? { ...msg, content: '[Deleted]', is_deleted: true } : msg
        )
      );
    }

    if (data.type === 'typing') {
      if (data.user_id !== currentUser?.id) {
        setTypingUsers(prev => new Set([...prev, data.full_name]));
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.full_name);
            return newSet;
          });
        }, 3000);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !file) return;

    try {
      if (file) {
        const fileData = await uploadChatFile(file);
        socketRef.current.sendFile(fileData.file_url, fileData.file_type);
        setFile(null);
      }

      if (input.trim()) {
        socketRef.current.sendMessage(input);
        setInput('');
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.sendTyping();
    typingTimeoutRef.current = setTimeout(() => {}, 1000);
  };

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderFileAttachment = (msg) => {
    if (!msg.file_url) return null;
    const url = `${BASE_URL}${msg.file_url}`;

    switch (msg.file_type) {
      case 'image':
        return (
          <img
            src={url}
            alt="attachment"
            className="max-w-xs rounded-lg my-2 cursor-pointer"
            onClick={() => window.open(url, '_blank')}
          />
        );
      case 'audio':
        return <audio src={url} controls className="my-2 w-full" />;
      case 'video':
        return <video src={url} controls className="my-2 max-w-xs rounded-lg" />;
      default:
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 underline my-2 block"
          >
            Download {msg.file_type}
          </a>
        );
    }
  };

  return (
    <Card className="h-[75vh] flex flex-col">
      <CardContent className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.sender?.id === currentUser?.id;
            const senderName = isMe ? 'Me' : msg.sender?.full_name || `User ${msg.sender?.id}`;

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-muted-foreground font-medium">{senderName}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div
                    className={`p-3 rounded-lg shadow-sm ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}
                  >
                    {msg.is_deleted ? (
                      <span className="italic text-muted-foreground text-sm">[Message deleted]</span>
                    ) : (
                      <div className="text-sm space-y-2">
                        {msg.content && <div>{msg.content}</div>}
                        {renderFileAttachment(msg)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {typingUsers.size > 0 && (
            <div className="flex justify-start">
              <div className="max-w-[70%]">
                <div className="text-xs text-muted-foreground mb-1">
                  {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </div>
                <div className="bg-muted text-foreground p-3 rounded-lg rounded-bl-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </CardContent>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
            id="chat-file"
          />
          <label htmlFor="chat-file" className="cursor-pointer text-muted-foreground hover:text-foreground">
            <Paperclip size={20} />
          </label>

          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            disabled={isLoading}
          />

          <Button onClick={handleSend} disabled={isLoading} size="icon">
            <Send size={16} />
          </Button>
        </div>

        {file && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>{file.name}</span>
            <button onClick={() => setFile(null)} className="text-red-500 text-xs ml-2 hover:underline">
              Remove
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};
