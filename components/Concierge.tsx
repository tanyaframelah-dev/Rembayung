import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';

export const Concierge: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I’m your Concierge. While you wait, feel free to ask me anything about the menu, dress code, or atmosphere.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(userText);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "I apologize, connection interrupted." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-card">
      <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-white font-serif text-xl">
            R
        </div>
        <div>
            <h3 className="font-bold text-gray-800 text-sm">Concierge Support</h3>
            <p className="text-xs text-gray-500">Typically responds instantly</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-gray-800 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white text-gray-400 rounded-2xl rounded-bl-none px-4 py-2 text-xs italic border border-gray-100 shadow-sm">
               The concierge is typing...
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Message the host..."
          className="flex-1 bg-gray-100 border-none rounded-full px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="bg-airbnb-red hover:bg-airbnb-dark text-white p-3 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center aspect-square"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
};