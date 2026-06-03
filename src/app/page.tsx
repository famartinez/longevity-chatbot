'use client';

import { useState } from 'react';

// Define a simple TypeScript interface for our messages
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  // 1. Manually control the message history and input states
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Custom submit handler to send the message to /api/chat
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessageContent = input;
    setInput(''); // Clear input box immediately
    setIsLoading(true);

    // Create and append the user's message locally
    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: userMessageContent,
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      // Hit your Next.js API endpoint directly
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      // Read the streamed response text
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No readable response stream found.');
      }

      // Add a blank placeholder assistant message that we will fill up stream by stream
      const assistantMessageId = Math.random().toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: 'assistant', content: '' },
      ]);

      let fullAssistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the binary stream chunk into text
        const chunk = decoder.decode(value, { stream: true });
        
        // Vercel AI SDK data streams embed parts (like 0:"text"). Clean it up roughly:
        const cleanChunk = chunk.replace(/^\d+:"/g, '').replace(/"$/g, '').replace(/\\n/g, '\n');

        fullAssistantContent += cleanChunk;

        // Progressively update the assistant message bubble
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, content: fullAssistantContent } : m
          )
        );
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong while fetching the AI.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto h-screen bg-slate-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="p-4 bg-white dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 text-center">
        <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Aegis AI</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Fitness, Supplement & Longevity Advisor</p>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="m-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 my-12">
            Ask me anything about VO2 max protocols, hypertrophy splits, or supplement efficacy!
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
              m.role === 'user' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-zinc-700'
            }`}>
              <span className="block font-semibold text-xs mb-1 opacity-75">
                {m.role === 'user' ? 'You' : 'Aegis'}
              </span>
              <p className="whitespace-pre-wrap text-sm">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="text-slate-400 text-xs italic">Aegis is thinking...</div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleCustomSubmit} className="p-4 bg-white dark:bg-zinc-800 border-t border-slate-200 dark:border-zinc-700 flex gap-2">
        <input
          className="flex-1 p-2 border border-slate-300 dark:border-zinc-600 rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
          value={input}
          placeholder="e.g., What is the best supplement stack for cellular health?"
          onChange={(e) => setInput(e.target.value)} // Direct Native State Handler
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading} 
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}