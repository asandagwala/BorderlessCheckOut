'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Bot, Send, Loader2, Database, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  toolUsed?: string;
  timestamp: string;
}

export function ChatbotView({
  merchantId,
  isFloating = false,
  onClose,
}: {
  merchantId: string;
  isFloating?: boolean;
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: "Hello! I am your AI Merchant Assistant powered by the Claude API and your real on-chain transaction records on Base Sepolia. How can I help with your store metrics today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "How much have I received today?",
    "Which orders are still unpaid?",
    "Show me my recent transactions.",
    "What is my current USDC balance?",
  ];

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.sender,
        content: m.text,
      }));

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          message: text,
          history,
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        sender: 'assistant',
        text: data.response || "I could not retrieve an answer at this time.",
        toolUsed: data.toolUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          text: `Error connecting to assistant: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#fff3e2] ${isFloating ? '' : 'rounded-[35px] border-[5px] border-[#700c20] p-6 shadow-sm min-h-[600px]'}`}>
      {!isFloating && (
        <div className="pb-4 border-b border-[#700c20]/20 flex flex-row items-center justify-between mb-4">
          <div>
            <h2 className="font-montserrat-extrabold text-2xl text-zinc-950">
              AI Merchant Assistant
            </h2>
            <p className="text-xs font-play text-zinc-600 mt-1">
              Read-only merchant reporting powered by Claude tool calling over verified Base Sepolia receipts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-play font-bold px-3 py-1 rounded-full bg-[#700c20] text-white">
              Read-Only Guardian
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white border border-[#700c20]/30 flex items-center justify-center text-[#700c20] hover:bg-[#700c20] hover:text-white transition-colors cursor-pointer"
                title="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#700c20] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-[24px] px-4 py-3 text-xs sm:text-sm font-play leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-[#700c20] text-white font-medium'
                  : 'bg-white text-zinc-900 border-2 border-[#700c20]/20'
              }`}
            >
              {msg.toolUsed && (
                <div className="flex items-center gap-1.5 text-[10px] text-[#700c20] font-bold mb-1.5 uppercase tracking-wider">
                  <Database className="w-3 h-3" />
                  <span>Verified via: {msg.toolUsed}</span>
                </div>
              )}
              <div className="whitespace-pre-line">{msg.text}</div>
              <div className={`text-[10px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-zinc-200' : 'text-zinc-400'}`}>
                {msg.timestamp}
              </div>
            </div>
            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-sm font-bold text-xs">
                U
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-zinc-600 font-play py-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#700c20]" />
            <span>Consulting on-chain store records...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="py-2 flex flex-wrap gap-1.5">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(p)}
            className="text-[11px] font-play font-bold px-3 py-1.5 rounded-full bg-white text-[#700c20] border border-[#700c20] hover:bg-[#700c20] hover:text-white transition-all cursor-pointer shadow-xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="pt-2 flex items-center gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about payments, sales, or balance..."
          className="bg-white border-2 border-[#700c20] rounded-[35px] text-xs font-play h-11 px-4 focus-visible:ring-0 focus-visible:border-[#700c20]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-11 px-5 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs hover:bg-[#520917] disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
