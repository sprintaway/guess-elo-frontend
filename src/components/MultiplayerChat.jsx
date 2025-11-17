import React, { useState, useEffect, useRef } from 'react';

export function MultiplayerChat({ roomCode, playerName, socket }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data) => {
      setMessages(prev => [...prev, {
        player: data.playerName,
        message: data.message,
        timestamp: data.timestamp || Date.now(),
        isOwn: data.playerName === playerName
      }]);
    };

    socket.on('chat_message', handleChatMessage);

    return () => {
      socket.off('chat_message', handleChatMessage);
    };
  }, [socket, playerName]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !socket) return;

    // Send via WebSocket
    socket.emit('send_chat_message', {
      roomCode,
      playerName,
      message: inputMessage.trim()
    });

    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-slate-700 rounded-lg md:rounded-xl overflow-hidden">
      {/* Chat Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-2 sm:p-3 md:p-4 bg-slate-600 hover:bg-slate-500 transition flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg sm:text-xl md:text-2xl">💬</span>
          <h3 className="text-sm sm:text-base md:text-xl font-bold text-emerald-400">
            Chat
          </h3>
          {messages.length > 0 && (
            <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm sm:text-base">
          {isExpanded ? '▼' : '▲'}
        </span>
      </button>

      {/* Chat Body - Collapsible */}
      {isExpanded && (
        <div className="flex flex-col">
          {/* Messages Container */}
          <div 
            ref={chatContainerRef}
            className="h-32 sm:h-40 md:h-48 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 bg-slate-800"
            style={{ scrollbarWidth: 'thin' }}
          >
            {messages.length === 0 ? (
              <p className="text-gray-400 text-xs sm:text-sm text-center py-4">
                No messages yet. Say hi! 👋
              </p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 ${
                      msg.isOwn
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-600 text-gray-100'
                    }`}
                  >
                    {!msg.isOwn && (
                      <p className="text-xs font-semibold mb-0.5 opacity-80">
                        {msg.player}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm break-words">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-2 sm:p-3 md:p-4 bg-slate-700 border-t border-slate-600">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                maxLength={200}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className={`px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
                  inputMessage.trim()
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Press Enter to send
            </p>
          </div>
        </div>
      )}
    </div>
  );
}