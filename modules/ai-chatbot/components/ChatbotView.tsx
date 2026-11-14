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
      text: "Hello! I’m your UHURU assistant. I can help you understand your sales, verified payments, and outstanding orders.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'How much have I received today?',
    'Which orders are still unpaid?',
    'Show me my recent transactions.',
    'What is my current USDC balance?',
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
      const history = messages.map((m) => ({
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
        text: data.response || 'I could not retrieve an answer at this time.',
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
    <div
      className={`flex flex-col h-full bg-[#FFF8EE] ${
        isFloating ? '' : 'rounded-2xl border border-[#E8DCD0] p-6 shadow-sm min-h-[600px]'
      }`}
    >
      {!isFloating && (
        <div className="pb-4 border-b border-[#EFE5DA] flex flex-row items-center justify-between mb-4">
          <div>
            <h2 className="font-montserrat-extrabold text-2xl text-[#181412]">
              AI Merchant Assistant
            </h2>
            <p className="text-xs text-[#685D55] mt-1">
              Clear, read-only answers based on your verified payment records.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#C84B24] text-white">
              Read-Only Guardian
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white border border-[#E4D5C5] flex items-center justify-center text-[#C84B24] hover:bg-[#C84B24] hover:text-white transition-colors cursor-pointer"
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
            className={`flex items-start gap-2.5 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-[#C84B24] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-[#C84B24] text-white font-medium'
                  : 'bg-white text-[#181412] border border-[#E8DCD0]'
              }`}
            >
              {msg.toolUsed && (
                <div className="flex items-center gap-1.5 text-[10px] text-[#1E6B45] font-bold mb-1.5 uppercase tracking-wider">
                  <Database className="w-3 h-3" />
                  <span>Verified via: {msg.toolUsed}</span>
                </div>
              )}
              <div className="whitespace-pre-line">{msg.text}</div>
              <div
                className={`text-[10px] mt-1.5 text-right ${
                  msg.sender === 'user' ? 'text-[#FFE5D6]' : 'text-[#8C7B6E]'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-[#181412] text-white flex items-center justify-center shrink-0 shadow-xs font-arain text-xs">
                U
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#685D55] py-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#C84B24]" />
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
            className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white text-[#463C35] border border-[#E4D5C5] hover:border-[#C84B24] hover:bg-[#C84B24] hover:text-white transition-all cursor-pointer shadow-xs"
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
          className="bg-white border border-[#DCCBC0] rounded-xl text-xs h-11 px-4 focus-visible:ring-[#C84B24]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-11 px-5 rounded-xl bg-[#C84B24] text-white font-bold text-xs hover:bg-[#A63816] disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
