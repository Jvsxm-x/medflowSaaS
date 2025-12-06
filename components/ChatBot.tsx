// components/ChatBot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../constants';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const ChatBot = () => {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Get chat history for connected users ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) {
        // Pas connecté → message initial
        setMessages([
          { role: 'assistant', content: "Bonjour ! Je suis Dawini, votre assistant médical. Comment puis-je vous aider aujourd'hui ?" }
        ]);
        return;
      }
      console.log("Fetching chat history...");
      console.log("Using token:", token);
      try {
        const response = await fetch(`${API_BASE_URL}/chat/history/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        if (data.history && data.history.length > 0) {
          setMessages(data.history);
        } else {
          setMessages([
            { role: 'assistant', content: "Bonjour ! Je suis Dawini, votre assistant médical. Comment puis-je vous aider aujourd'hui ?" }
          ]);
        }
      } catch (err) {
        console.error("Erreur récupération historique chat :", err);
        setMessages([
          { role: 'assistant', content: "Bonjour ! Je suis Dawini, votre assistant médical. Comment puis-je vous aider aujourd'hui ?" }
        ]);
      }
    };

    fetchHistory();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    setIsLoading(true);
      console.log("User message:", userMessage);
      console.log("User info:", user);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
  headers['Authorization'] = `Bearer ${token}`;  // CORRIGÉ : Bearer, pas Token !
}
     
      const response = await fetch(`${API_BASE_URL}/chat/`, {
        method: 'POST',
        headers,
body: JSON.stringify({ message: userMessage , user: user ? user.username : null }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Erreur réseau");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const data = part.slice(6);
          if (data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);
            const content = json.content;
            if (!content) continue;

            setMessages(prev => {
              const newMsgs = [...prev];
              const last = newMsgs[newMsgs.length - 1];
              if (last.role === "assistant" && !last.content.endsWith(content)) {
                last.content += content;
              }
              return newMsgs;
            });
          } catch (err) {}
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'system', content: "Je suis temporairement indisponible." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-5 bg-gradient-to-br from-teal-500 to-blue-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all z-50 hover:scale-110"
        >
          <MessageCircle size={36} />
        </button>
      )}

      <div className={`fixed bottom-6 right-6 w-96 h-[620px] bg-white rounded-2xl shadow-3xl border border-gray-200 flex flex-col z-50 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-5 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot size={36} />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-3 border-white rounded-full"></span>
            </div>
            <div>
              <h3 className="font-bold text-lg">Dawini Assistant IA</h3>
              <p className="text-xs opacity-90">
                {user ? `${user.first_name || user.username}` : 'Mode invité'}
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                ${msg.role === 'assistant' ? 'bg-teal-100' : msg.role === 'user' ? 'bg-blue-600' : 'bg-red-100'}`}>
                {msg.role === 'assistant' ? <Sparkles size={20} className="text-teal-600" /> :
                 msg.role === 'user' ? <UserIcon size={20} className="text-white" /> :
                 <Bot size={20} className="text-red-600" />}
              </div>

              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-md
                ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' :
                  msg.role === 'system' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-white text-gray-800 border border-gray-200 rounded-tl-none'}`}>

                {msg.content.split('\n').map((line, j) => (
                  <p key={j} className={j > 0 ? 'mt-2' : ''}>{line || ' '}</p>
                ))}

                {msg.role === 'assistant' && msg.content === '' && (
                  <div className="flex gap-1 mt-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-white border-t rounded-b-2xl">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question santé..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-teal-500 to-blue-600 text-white p-3 rounded-xl hover:from-teal-600 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg"
            >
              {isLoading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-3">
            L'IA peut faire des erreurs. Vérifiez toujours les informations médicales importantes.
          </p>
        </form>
      </div>
    </>
  );
};
