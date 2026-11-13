
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, User, Loader2, Database, ShieldAlert, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  toolUsed?: string;
  timestamp: string;
}

export function ChatbotView({ merchantId, onClose }: { merchantId: string; onClose?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: "Hello! I am your AI Merchant Assistant powered by the Claude API and your real on-chain transaction records. How can I help with your store metrics today?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "How much have I received today?",
    "Which orders are still unpaid?",
    "Show me my recent transactions.",
    "What is my current USDC balance?",
    "Summarise my payment activity this week.",
  ];

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(),
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
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          text: `Error connecting to assistant: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full min-h-0">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#700c20]/10 text-[#700c20] flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">AI Merchant Chatbot</CardTitle>
              <CardDescription className="text-xs">
                Answers store questions using actual Base Sepolia transaction data via Claude API
              </CardDescription>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-md">
            <ShieldAlert className="w-3.5 h-3.5 text-[#700c20]" />
            <span>Read-only assistant</span>
          </div>
          {onClose && <button type="button" onClick={onClose} aria-label="Close assistant" className="rounded-full p-2 hover:bg-[#f8edf0] text-[#700c20]"><X size={17}/></button>}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#700c20] flex items-center justify-center text-white shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-none'
                  : 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50'
              }`}
            >
              {m.toolUsed && (
                <div className="mb-2 flex items-center gap-1.5 text-[10px] text-[#700c20] dark:text-emerald-400 font-mono bg-[#f8edf0] dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-[#eadfe2] dark:border-emerald-800 w-fit">
                  <Database className="w-3 h-3" />
                  <span>Executed Tool: {m.toolUsed}()</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{m.text}</div>
              <span className="text-[10px] opacity-60 block mt-1 text-right">{m.timestamp}</span>
            </div>

            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-zinc-500">
            <div className="w-7 h-7 rounded-full bg-[#700c20] flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#700c20]" />
              <span>Querying verified store records...</span>
            </div>
          </div>
        )}
      </CardContent>

      <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex gap-1.5 overflow-x-auto text-xs">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(p)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-[#700c20] hover:text-[#700c20] transition-colors text-[11px]"
          >
            {p}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex gap-2"
      >
        <Input
          placeholder="Ask a question about your payments, balance or orders..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="text-xs sm:text-sm"
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-[#700c20] hover:bg-[#580918] text-white px-4 shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
}
