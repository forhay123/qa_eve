
import React, { useState, useRef, useEffect } from 'react';
import ResponsiveLayout from '../layouts/ResponsiveLayout';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ChatbotPage = () => {
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [responseType, setResponseType] = useState('text');
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const storedChat = localStorage.getItem('chatHistory');
    if (storedChat) setChatLog(JSON.parse(storedChat));
  }, []);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatLog));
  }, [chatLog]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [chatLog, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [chatLog]);

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const sendQuestion = async () => {
    const trimmed = question.trim();
    if (!trimmed) return;

    const newChatLog = [
      ...chatLog,
      {
        sender: 'student',
        message: trimmed,
        timestamp: new Date().toISOString(),
      },
    ];
    setChatLog(newChatLog);
    setQuestion('');
    setLoading(true);

    try {
      const history = newChatLog.slice(0, -1).map((msg) => ({
        role: msg.sender === 'student' ? 'user' : 'assistant',
        content: msg.message,
      }));

      const res = await fetch(`${API_BASE_URL}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, history }),
      });

      const data = await res.json();
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          message: data.answer || 'No response.',
          audio: data.audio_base64 || null,
          image: data.image_url || null,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          message: `❌ Error: ${err.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  };

  return (
      <div className="max-w-3xl mx-auto px-4 py-6 h-[calc(100vh-7rem)] flex flex-col bg-background text-foreground">
        <h2 className="text-2xl font-bold mb-4 text-center">🤖 Ask Your AI Tutor</h2>

        <div className="mb-4">
          <label className="font-medium">Preferred Response Type:</label>
          <select
            value={responseType}
            onChange={(e) => setResponseType(e.target.value)}
            className="ml-2 border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="text">Text</option>
            <option value="audio">Audio</option>
            <option value="image">Image</option>
          </select>
        </div>

        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-muted/30 rounded border border-border"
        >
          {chatLog.length === 0 && !loading && (
            <div className="text-muted-foreground text-center py-8">
              <p>Start by typing a question...</p>
              <p className="text-sm mt-1">💡 Try: "Explain balance sheet" or "Draw a food web"</p>
            </div>
          )}

          {chatLog.map((msg, idx) => (
            <div key={idx} className={`mb-4 ${msg.sender === 'student' ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block px-4 py-2 rounded-lg max-w-xs break-words ${
                  msg.sender === 'student'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-card-foreground border border-border'
                }`}
              >
                <pre className="whitespace-pre-wrap">{msg.message}</pre>
                {msg.audio && (
                  <audio controls className="mt-2">
                    <source src={`data:audio/mp3;base64,${msg.audio}`} type="audio/mp3" />
                  </audio>
                )}
                {msg.image && (
                  <img src={msg.image} alt="Visual" className="mt-2 max-w-full rounded shadow" />
                )}
                <div className="text-[10px] text-muted-foreground mt-1">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-left mt-2 text-muted-foreground italic">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-b-2 border-primary rounded-full"></div>
                <span>AI is thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <textarea
            ref={inputRef}
            rows={2}
            className="flex-1 border border-border rounded-md p-2 resize-none bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Type your question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button
            onClick={sendQuestion}
            disabled={loading || !question.trim()}
            className={`px-4 py-2 rounded-md transition-colors ${
              loading || !question.trim()
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
  );
};

export default ChatbotPage;
