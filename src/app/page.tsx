'use client';

import { useState } from 'react';
import Image from 'next/image'; // Optimized Next.js image handler

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessageContent = input;
    setInput('');
    setIsLoading(true);

    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: userMessageContent,
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No readable response stream found.');
      }

      const assistantMessageId = Math.random().toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: 'assistant', content: '' },
      ]);

      let fullAssistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const cleanChunk = chunk.replace(/^\d+:"/g, '').replace(/"$/g, '').replace(/\\n/g, '\n');
        fullAssistantContent += cleanChunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, content: fullAssistantContent } : m
          )
        );
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto h-screen bg-slate-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="p-4 bg-white dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 text-center">
        <h1 className="text-xl font-bold text-amber-600 dark:text-amber-400">Wally AI</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Fitness, Supplement & Longevity Advisor</p>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="m-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center my-6 space-y-6 animate-fade-in">
            
            {/* Custom Mascot Showcase Card */}
            <div className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-700 shadow-md bg-white dark:bg-zinc-800 p-2">
              <div className="relative w-full aspect-[1/2.2] rounded-lg overflow-hidden">
                <Image 
                  src="/wally-stats.png" 
                  alt="Wally Longevity Tracker Metrics"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div className="text-center text-sm max-w-md text-slate-500 dark:text-slate-400">
              🐾 Hi! I am <span className="font-semibold text-amber-600 dark:text-amber-400">Wally</span>. Ask me anything about VO2 max protocols, hypertrophy splits, or supplement efficacy!
            </div>
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
              m.role === 'user' 
                ? 'bg-amber-600 text-white' 
                : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-zinc-700'
            }`}>
              <span className="block font-semibold text-xs mb-1 opacity-75">
                {m.role === 'user' ? 'You' : 'Wally'}
              </span>
              <p className="whitespace-pre-wrap text-sm">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="text-slate-400 text-xs italic pl-1">Wally is looking up clinical data...</div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleCustomSubmit} className="p-4 bg-white dark:bg-zinc-800 border-t border-slate-200 dark:border-zinc-700 flex gap-2">
        <input
          className="flex-1 p-2 border border-slate-300 dark:border-zinc-600 rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
          value={input}
          placeholder="e.g., What is the best supplement stack for cellular health?"
          onChange={(e) => setInput(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading} 
          className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
        >
          Ask Wally
        </button>
      </form>
    </div>
  );
}