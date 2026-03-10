import React, { useState, useRef, useEffect } from 'react';
import { BirthInfo, BaziData, AstrologyData, AnalysisMode } from '../types';
import { chatWithAI, getFollowUpQuestions, isQuotaError } from '../services/geminiService';
import { Send, Bot, User, Loader2, Sparkles, Moon, Sun, Trash2, PlusCircle, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';

interface AIChatProps {
  info: BirthInfo;
  bazi: BaziData;
  astrology: AstrologyData;
}

export default function AIChat({ info, bazi, astrology }: AIChatProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AnalysisMode>('mixed');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    
    // Set initial mount to false after we've had a chance to load
    setTimeout(() => {
      isInitialMount.current = false;
    }, 100);
  }, []);

  // Save history on change
  useEffect(() => {
    if (isInitialMount.current) return;
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  // Fetch suggestions on mount or when messages change (if empty)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (suggestions.length === 0 && !loading) {
        try {
          const nextSuggestions = await getFollowUpQuestions(info, bazi, astrology, messages);
          setSuggestions(nextSuggestions.map(s => s.length > 20 ? s.substring(0, 17) + '...' : s));
        } catch (e) {
          console.error('Failed to fetch suggestions', e);
        }
      }
    };

    // Delay slightly to ensure messages are loaded from localStorage
    const timer = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timer);
  }, [messages.length, loading, info, bazi, astrology]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, text?: string) => {
    if (e) e.preventDefault();
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setInput('');
    setSuggestions([]); // Clear suggestions while loading

    if (messageText === '切换个人密钥' && window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setMessages(prev => [...prev, { role: 'assistant', text: '密钥已更新！您可以继续提问了。' }]);
      return;
    }

    if (messageText === '重试上一个问题') {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        handleSend(undefined, lastUserMsg.text);
        return;
      }
    }

    const newMessages = [...messages, { role: 'user' as const, text: messageText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await chatWithAI(info, bazi, astrology, messageText, newMessages, mode);
      const assistantMsg = { role: 'assistant' as const, text: response || '抱歉，我暂时无法回答。' };
      const updatedMessages = [...newMessages, assistantMsg];
      setMessages(updatedMessages);

      // Fetch follow-up questions
      const nextSuggestions = await getFollowUpQuestions(info, bazi, astrology, updatedMessages);
      setSuggestions(nextSuggestions.map(s => s.length > 20 ? s.substring(0, 17) + '...' : s));
    } catch (err: any) {
      console.error(err);
      let errorMsg = '出错了，请稍后再试。';
      let isQuota = false;
      if (isQuotaError(err)) {
        errorMsg = 'Gemini API 配额已耗尽（共享环境限制）。建议切换至您的个人 API 密钥以获得更稳定的体验。';
        isQuota = true;
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: errorMsg + (isQuota ? '\n\n您可以点击下方的“切换个人密钥”按钮。' : '')
      }]);

      if (isQuota && window.aistudio?.openSelectKey) {
        setSuggestions(['切换个人密钥', '重试上一个问题']);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('chatHistory');
    setShowConfirmClear(false);
  };

  const downloadHistory = () => {
    if (messages.length === 0) return;
    
    const content = messages.map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.text}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `命理咨询历史_${new Date().toLocaleDateString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">AI 命理顾问</h3>
              <p className="text-xs text-indigo-500 font-medium">已加载您的命盘信息</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={downloadHistory}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  title="下载对话"
                >
                  <Download size={18} />
                </button>
                <div className="relative">
                  {showConfirmClear ? (
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-red-100 p-1 shadow-sm animate-in fade-in zoom-in duration-200">
                      <button
                        onClick={clearHistory}
                        className="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        确认删除
                      </button>
                      <button
                        onClick={() => setShowConfirmClear(false)}
                        className="px-2 py-1 text-[10px] font-bold bg-gray-100 text-gray-500 rounded hover:bg-gray-200 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirmClear(true)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="清除历史"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Mode Selector */}
            <div className="flex bg-white/50 p-1 rounded-xl border border-indigo-100/50 backdrop-blur-sm">
              <button
                onClick={() => setMode('bazi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  mode === 'bazi' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-white/80'
                }`}
              >
                <Sun size={12} />
                八字
              </button>
              <button
                onClick={() => setMode('astrology')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  mode === 'astrology' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-white/80'
                }`}
              >
                <Moon size={12} />
                星盘
              </button>
              <button
                onClick={() => setMode('mixed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  mode === 'mixed' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-white/80'
                }`}
              >
                <Sparkles size={12} />
                混合
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <Bot size={48} className="mx-auto text-gray-300" />
            <p className="text-gray-400 max-w-xs mx-auto">
              当前模式：<span className="text-indigo-600 font-medium">
                {mode === 'bazi' ? '东方八字' : mode === 'astrology' ? '西方星盘' : '东西方混合'}
              </span>
              <br />
              您可以问我关于事业、感情、财运等方面的问题。
            </p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-gray-100 text-gray-600 shadow-sm'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-100 text-gray-800'
                }`}>
                  <div className={`prose max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-indigo'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Suggestions */}
        {!loading && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {suggestions.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleSend(undefined, s)}
                className="px-4 py-2 bg-white border border-indigo-100 text-indigo-600 text-xs font-medium rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center gap-2 shadow-sm"
              >
                <PlusCircle size={12} />
                {s}
              </motion.button>
            ))}
          </div>
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center text-gray-400">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                <Bot size={16} />
              </div>
              <div className="flex gap-1">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-6 bg-white border-t border-gray-100 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入您的问题..."
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
}
