'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';

interface NutritionData {
  calories: number;
  carbs?: number;
  fat?: number;
  protein?: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  extractedCalories?: number[];
  extractedCarbs?: number | null;
  extractedFat?: number | null;
  extractedProtein?: number | null;
  foodDescription?: string; // The food being discussed when this response was generated
}

interface CalorieAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNutrition: (nutrition: NutritionData, foodDescription: string) => void;
  gender: 'male' | 'female';
}

export function CalorieAIModal({ isOpen, onClose, onSelectNutrition, gender }: CalorieAIModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const primaryColor = gender === 'female' ? 'pink' : 'teal';

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          extractedCalories: data.extractedCalories,
          extractedCarbs: data.extractedCarbs,
          extractedFat: data.extractedFat,
          extractedProtein: data.extractedProtein,
          foodDescription: userMessage, // Store what the user asked about
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble processing that. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectNutrition = (
    calories: number,
    carbs: number | null | undefined,
    fat: number | null | undefined,
    protein: number | null | undefined,
    foodDescription: string
  ) => {
    onSelectNutrition(
      {
        calories,
        carbs: carbs ?? undefined,
        fat: fat ?? undefined,
        protein: protein ?? undefined,
      },
      foodDescription
    );
    onClose();
  };

  const handleClose = () => {
    setMessages([]);
    setInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r ${
          gender === 'female'
            ? 'from-pink-500 to-purple-500'
            : 'from-teal-500 to-blue-500'
        } rounded-t-3xl sm:rounded-t-3xl`}>
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-lg font-bold">Calorie Assistant</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                gender === 'female'
                  ? 'bg-pink-100 text-pink-500 dark:bg-pink-900/30 dark:text-pink-400'
                  : 'bg-teal-100 text-teal-500 dark:bg-teal-900/30 dark:text-teal-400'
              }`}>
                <Sparkles className="w-8 h-8" />
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                Ask me about calories in any food!
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['Chicken salad', 'Slice of pizza', 'Bowl of oatmeal'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      gender === 'female'
                        ? 'border-pink-200 text-pink-600 hover:bg-pink-50 dark:border-pink-800 dark:text-pink-400 dark:hover:bg-pink-900/30'
                        : 'border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-900/30'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? gender === 'female'
                      ? 'bg-pink-500 text-white'
                      : 'bg-teal-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Nutrition selection buttons */}
                {message.role === 'assistant' && message.extractedCalories && message.extractedCalories.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Tap to use:</p>
                    <div className="flex flex-col gap-2">
                      {message.extractedCalories.map((cal, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectNutrition(
                            cal,
                            message.extractedCarbs,
                            message.extractedFat,
                            message.extractedProtein,
                            message.foodDescription || ''
                          )}
                          className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all active:scale-95 ${
                            gender === 'female'
                              ? 'bg-pink-500 hover:bg-pink-600 text-white'
                              : 'bg-teal-500 hover:bg-teal-600 text-white'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span>{cal} cal</span>
                            {(message.extractedCarbs != null || message.extractedFat != null || message.extractedProtein != null) && (
                              <span className="text-xs opacity-90">
                                {message.extractedCarbs ?? 0}g C / {message.extractedFat ?? 0}g F / {message.extractedProtein ?? 0}g P
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-3">
                <Loader2 className={`w-5 h-5 animate-spin ${
                  gender === 'female' ? 'text-pink-500' : 'text-teal-500'
                }`} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your meal..."
              className={`flex-1 px-4 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-base focus:outline-none ${
                gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
              }`}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`px-4 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                gender === 'female'
                  ? 'bg-pink-500 hover:bg-pink-600'
                  : 'bg-teal-500 hover:bg-teal-600'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
