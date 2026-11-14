'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { ChatbotView } from './ChatbotView';

export function FloatingChatbot({ merchantId }: { merchantId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Trigger Button in Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open UHURU business assistant"
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-[0_14px_34px_rgba(200,75,36,0.32)] flex items-center justify-center border-2 border-[#C84B24] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden"
        >
          {isOpen ? (
            <X className="w-6 h-6 sm:w-7 sm:h-7 text-[#C84B24]" />
          ) : (
            <>
              <Image
                src="/uhuru/chat-bot-icon.png"
                alt="UHURU Assistant"
                fill
                className="object-cover"
                sizes="64px"
              />
              <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1E6B45] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#1E6B45] border-2 border-white"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] max-h-[82vh] h-[640px] rounded-2xl border-2 border-[#C84B24]/30 bg-white shadow-[0_24px_60px_rgba(24,20,18,0.24)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#C84B24] via-[#B23822] to-[#8B1E24] text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center overflow-hidden border border-white/25">
                <Image
                  src="/uhuru/chat-bot-icon.png"
                  alt=""
                  width={26}
                  height={26}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-montserrat-extrabold text-base tracking-tight leading-none">
                  UHURU Assistant
                </h3>
                <p className="text-[11px] text-[#FFE5D6] mt-1">
                  Clear answers about your sales and payments
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Chatbot Content Area */}
          <div className="flex-1 overflow-hidden p-2 sm:p-4 bg-[#FFF8EE]">
            <ChatbotView merchantId={merchantId} isFloating />
          </div>
        </div>
      )}
    </>
  );
}
