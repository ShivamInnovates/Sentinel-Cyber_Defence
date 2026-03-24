import { useState, useEffect, useRef } from 'react';
import '../styles/ChatBot.css';

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [lastSources, setLastSources] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': 'sentinel-demo-key',
        },
        body: JSON.stringify({ query: input }),
      });

      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.answer };
      setMessages(prev => [...prev, assistantMessage]);
      setLastSources(data.sources || []);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { role: 'assistant', content: 'Error communicating with SENTINEL. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/clear-history', {
        method: 'POST',
        headers: {
          'X-API-KEY': 'sentinel-demo-key',
        },
      });
      setMessages([]);
      setLastSources([]);
      setShowSources(false);
    } catch (error) {
      console.error('Clear history error:', error);
    }
  };

  return (
    <div className="chatbot-widget">
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="SENTINEL Chatbot"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>SENTINEL Chatbot</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {messages.length > 0 && (
                <button className="icon-btn" onClick={clearHistory} title="Clear history">
                  🗑️
                </button>
              )}
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.length === 0 ? (
              <div className="chatbot-welcome">
                <p>👋 Hello! I'm SENTINEL's AI assistant.</p>
                <p>Ask me anything about threat detection, phishing analysis, or system status.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))
            )}
            {loading && (
              <div className="message assistant">
                <div className="message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            {lastSources.length > 0 && (
              <div className="sources-indicator">
                <button 
                  onClick={() => setShowSources(!showSources)}
                  style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px' }}
                >
                  📚 {lastSources.length} source{lastSources.length !== 1 ? 's' : ''} {showSources ? '▼' : '▶'}
                </button>
                {showSources && (
                  <div className="sources-list">
                    {lastSources.map((src, idx) => (
                      <div key={idx} className="source-item">
                        <strong>Page {src.page}</strong>
                        <p>{src.snippet}...</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
              placeholder="Ask SENTINEL..."
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              {loading ? '...' : '→'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

