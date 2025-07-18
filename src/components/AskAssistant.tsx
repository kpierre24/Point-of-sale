// src/components/AskAssistant.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { askAssistant, type AskAssistantInput, type AskAssistantOutput } from '@/ai/flows/ask-assistant-flow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AskAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
           viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const assistantResponse = await askAssistant({ query: input });
      const assistantMessage: Message = { role: 'assistant', content: assistantResponse.answer };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error asking assistant:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: 'Assistant Error',
        description: `Could not get a response: ${errorMessage}`,
        variant: 'destructive',
      });
      // Optionally add an error message to the chat
       setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[400px]">
      <ScrollArea className="flex-grow p-4 border rounded-t-md bg-muted/30" ref={scrollAreaRef}>
        <div className="space-y-4">
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground p-4">
                    <p>Ask me anything about your business!</p>
                    <p className="text-xs mt-2">e.g., "What are today's sales?" or "Show me low stock items."</p>
                </div>
            )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'justify-end' : ''
              }`}
            >
              {message.role === 'assistant' && (
                <div className="bg-primary text-primary-foreground rounded-full p-2">
                  <Bot size={20} />
                </div>
              )}
              <div
                className={`max-w-xs rounded-lg px-4 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-primary/90 text-primary-foreground'
                    : 'bg-background border'
                }`}
              >
                {message.content}
              </div>
               {message.role === 'user' && (
                <div className="bg-secondary text-secondary-foreground rounded-full p-2">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <Bot size={20} />
                </div>
                <div className="max-w-xs rounded-lg px-4 py-2 text-sm bg-background border flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                </div>
             </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 border-t border-x border-b rounded-b-md bg-background">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
          autoComplete="off"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send size={16} />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
