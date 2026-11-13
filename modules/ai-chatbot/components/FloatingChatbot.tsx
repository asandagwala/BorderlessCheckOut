'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Bot, Sparkles } from 'lucide-react';
import { ChatbotView } from './ChatbotView';

export function FloatingChatbot({ merchantId }: { merchantId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Trigger Button in Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle AI Assistant"
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#700c20] text-white shadow-2xl flex items-center justify-center border-4 border-white hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          {isOpen ? (
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          ) : (
            <>
              <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] max-h-[82vh] h-[640px] rounded-[35px] border-[5px] border-[#700c20] bg-[#fff3e2] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#700c20] text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-montserrat-extrabold text-base tracking-tight leading-none">
                  AI Merchant Assistant
                </h3>
                <p className="text-[11px] font-play text-zinc-200 mt-1">
                  Claude API · Real On-Chain Verifications
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Chatbot Content Area */}
          <div className="flex-1 overflow-hidden p-2 sm:p-4 bg-[#fff3e2]">
            <ChatbotView merchantId={merchantId} isFloating />
          </div>
        </div>
      )}
    </>
  );
}
