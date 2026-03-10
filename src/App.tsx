import React, { useState, useEffect } from 'react';
import { BirthInfo, BaziData, AstrologyData, Page, FortuneData } from './types';
import { calculateBazi } from './services/baziService';
import { calculateAstrology } from './services/astrologyService';
import { getComprehensiveAnalysis, isQuotaError } from './services/geminiService';
import BirthForm from './components/BirthForm';
import BaziChart from './components/BaziChart';
import NatalChart from './components/NatalChart';
import AIChat from './components/AIChat';
import { 
  LayoutDashboard, 
  Sparkles, 
  MessageSquare, 
  CalendarDays, 
  ChevronLeft,
  Loader2,
  Compass,
  Star,
  Moon,
  Sun,
  Copy,
  Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [baziData, setBaziData] = useState<BaziData | null>(null);
  const [astrologyData, setAstrologyData] = useState<AstrologyData | null>(null);
  const [baziAnalysis, setBaziAnalysis] = useState<string>('');
  const [astrologyAnalysis, setAstrologyAnalysis] = useState<string>('');
  const [fortuneData, setFortuneData] = useState<FortuneData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [hasUserKey, setHasUserKey] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    });
  };

  useEffect(() => {
    const checkKey = async () => {
      // Check for shared key
      const sharedKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      
      // If shared key doesn't exist, we consider the key missing
      if (!sharedKey) {
        setApiKeyMissing(true);
      } else {
        setApiKeyMissing(false);
      }
    };
    
    checkKey();

    const savedInfo = localStorage.getItem('birthInfo');
    if (savedInfo) {
      try {
        const info = JSON.parse(savedInfo);
        setBirthInfo(info);
        
        // Load saved analysis if available
        const savedBaziAnalysis = localStorage.getItem('baziAnalysis');
        const savedAstroAnalysis = localStorage.getItem('astrologyAnalysis');
        const savedFortuneData = localStorage.getItem('fortuneData');
        const savedFortuneDate = localStorage.getItem('fortuneDate');
        const today = new Date().toISOString().split('T')[0];
        
        if (savedBaziAnalysis && savedAstroAnalysis && savedFortuneData && savedFortuneDate === today) {
          setBaziAnalysis(savedBaziAnalysis);
          setAstrologyAnalysis(savedAstroAnalysis);
          setFortuneData(JSON.parse(savedFortuneData));
          setBaziData(calculateBazi(info));
          setAstrologyData(calculateAstrology(info));
          setPage('bazi');
        } else {
          handleBirthSubmit(info);
        }
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
  }, []);

  const handleBirthSubmit = async (info: BirthInfo) => {
    setError(null);
    setBirthInfo(info);
    localStorage.setItem('birthInfo', JSON.stringify(info));
    
    const bazi = calculateBazi(info);
    const astro = calculateAstrology(info);
    
    setBaziData(bazi);
    setAstrologyData(astro);
    
    // Show charts immediately
    setPage('bazi');
    
    // Then try to get AI analysis in the background
    setAiLoading(true);
    try {
      const analysis = await getComprehensiveAnalysis(info, bazi, astro);
      
      setBaziAnalysis(analysis.baziAnalysis);
      setAstrologyAnalysis(analysis.astrologyAnalysis);
      setFortuneData(analysis.fortuneData);
      
      // Save analysis results
      localStorage.setItem('baziAnalysis', analysis.baziAnalysis);
      localStorage.setItem('astrologyAnalysis', analysis.astrologyAnalysis);
      localStorage.setItem('fortuneData', JSON.stringify(analysis.fortuneData));
      localStorage.setItem('fortuneDate', new Date().toISOString().split('T')[0]);
    } catch (err: any) {
      console.error(err);
      if (isQuotaError(err)) {
        setError('AI 分析服务目前配额已满（共享环境限制）。建议点击左侧“使用个人密钥”按钮切换至您的个人 API 密钥以获得更稳定的服务。您可以先查看排盘图表。');
      } else {
        setError('获取 AI 分析报告时出错，您可以先查看排盘图表。');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasUserKey(true);
      setApiKeyMissing(false);
      // Force a refresh of the AI instance if needed by the service
    }
  };

  const renderContent = () => {
    if (error && page === 'home') {
      // Handled in the home page render
    }
    
    if (page === 'home') {
      return (
        <div className="space-y-12 py-6">
          {apiKeyMissing && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 text-red-800 mb-8">
              <div className="bg-red-100 p-3 rounded-2xl">
                <Sparkles className="text-red-600" size={24} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="font-bold text-lg">未检测到有效的 API 密钥</p>
                <p className="text-red-700/80">当前环境未配置 API 密钥。请在系统设置中配置 GEMINI_API_KEY 以启用 AI 功能。</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-800 animate-in fade-in slide-in-from-top-4">
              <Sparkles className="shrink-0 mt-0.5" size={18} />
              <div className="text-sm">
                <p className="font-bold">提示</p>
                <p>{error}</p>
              </div>
              <button onClick={() => setError(null)} className="ml-auto text-amber-400 hover:text-amber-600">
                <ChevronLeft className="rotate-90" size={18} />
              </button>
            </div>
          )}
          <div className="text-center space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight"
            >
              AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">命理分析</span> 平台
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-500 max-w-2xl mx-auto"
            >
              融合东方八字与西方占星，为您提供深度的人生洞察与决策支持。
            </motion.p>
          </div>
          <BirthForm onSubmit={handleBirthSubmit} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { title: '东方八字', desc: '精准排盘，五行分析，解读一生运势', icon: <Sun className="text-orange-500" /> },
              { title: '西方星盘', desc: '行星相位，宫位解读，探索人格潜能', icon: <Moon className="text-indigo-500" /> },
              { title: 'AI 算命', desc: '智能对话，实时解答，助您明智决策', icon: <Sparkles className="text-violet-500" /> }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    if (!birthInfo || !baziData || !astrologyData) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-6 border-b border-gray-50">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                {birthInfo.gender === 'male' ? '乾' : '坤'}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">当前分析对象</p>
                <p className="font-bold text-gray-800">{birthInfo.date}</p>
              </div>
            </div>
            
            <nav className="space-y-1">
              {[
                { id: 'bazi', label: '八字命盘', icon: <LayoutDashboard size={18} /> },
                { id: 'astrology', label: '西方星盘', icon: <Compass size={18} /> },
                { id: 'chat', label: 'AI 算命', icon: <MessageSquare size={18} /> },
                { id: 'fortune', label: '运势报告', icon: <CalendarDays size={18} /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id as Page)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    page === item.id 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="pt-4 border-t border-gray-50 space-y-2">
              {showConfirmReset ? (
              <div className="p-3 bg-red-50 rounded-2xl border border-red-100 space-y-3 mt-2 animate-in fade-in zoom-in duration-200">
                <p className="text-xs text-red-600 font-bold text-center">确定要清除所有数据吗？</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      localStorage.removeItem('birthInfo');
                      localStorage.removeItem('baziAnalysis');
                      localStorage.removeItem('astrologyAnalysis');
                      localStorage.removeItem('fortuneData');
                      localStorage.removeItem('fortuneDate');
                      localStorage.removeItem('chatHistory');
                      setBirthInfo(null);
                      setBaziAnalysis('');
                      setAstrologyAnalysis('');
                      setFortuneData(null);
                      setPage('home');
                      setShowConfirmReset(false);
                    }}
                    className="flex-1 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-colors"
                  >
                    确认清除
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 py-2 bg-white text-gray-500 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-400 hover:bg-red-50 transition-all mt-2"
              >
                <ChevronLeft size={18} className="rotate-180" />
                清除数据
              </button>
            )}

            <button
              onClick={() => setPage('home')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-400 hover:bg-gray-50 transition-all mt-2"
            >
              <ChevronLeft size={18} />
              重新输入
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {page === 'bazi' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <Sun className="text-orange-500" /> 八字命盘结构
                    </h2>
                    <BaziChart data={baziData} />
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-8 py-4 bg-indigo-50/50 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold">
                          <Sparkles size={18} />
                          <span>AI 深度命理分析报告</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {baziAnalysis && (
                            <button
                              onClick={() => copyToClipboard(baziAnalysis, 'bazi')}
                              className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-400 hover:text-indigo-600 transition-colors"
                              title="复制报告"
                            >
                              {copiedSection === 'bazi' ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          )}
                          <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">
                            Generated by Gemini 3.1 Pro
                          </div>
                        </div>
                      </div>
                      <div className="px-5 py-6 md:px-8 md:py-8 prose prose-indigo max-w-none min-h-[300px] break-words">
                        {aiLoading && !baziAnalysis ? (
                          <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-4 text-gray-400">
                            <div className="w-12 h-12 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="animate-pulse">AI 正在深度解析您的命格...</p>
                          </div>
                        ) : baziAnalysis ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{baziAnalysis}</ReactMarkdown>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] space-y-4 text-gray-400">
                            <Sparkles size={48} className="opacity-20" />
                            <p>AI 分析暂不可用，请稍后再试</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {page === 'astrology' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <Moon className="text-indigo-500" /> 西方星盘配置
                    </h2>
                    <NatalChart data={astrologyData} />
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-8 py-4 bg-violet-50/50 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-violet-700 font-bold">
                          <Sparkles size={18} />
                          <span>AI 深度占星分析报告</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {astrologyAnalysis && (
                            <button
                              onClick={() => copyToClipboard(astrologyAnalysis, 'astro')}
                              className="p-2 hover:bg-violet-100 rounded-lg text-violet-400 hover:text-violet-600 transition-colors"
                              title="复制报告"
                            >
                              {copiedSection === 'astro' ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          )}
                          <div className="text-[10px] uppercase tracking-wider text-violet-400 font-bold">
                            Generated by Gemini 3.1 Pro
                          </div>
                        </div>
                      </div>
                      <div className="px-5 py-6 md:px-8 md:py-8 prose prose-indigo max-w-none min-h-[300px] break-words">
                        {aiLoading && !astrologyAnalysis ? (
                          <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-4 text-gray-400">
                            <div className="w-12 h-12 border-4 border-violet-50 border-t-violet-500 rounded-full animate-spin" />
                            <p className="animate-pulse">AI 正在解读您的星盘配置...</p>
                          </div>
                        ) : astrologyAnalysis ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{astrologyAnalysis}</ReactMarkdown>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] space-y-4 text-gray-400">
                            <Sparkles size={48} className="opacity-20" />
                            <p>AI 分析暂不可用，请稍后再试</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {page === 'chat' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <MessageSquare className="text-indigo-600" /> AI 命理工作台
                  </h2>
                  <AIChat info={birthInfo} bazi={baziData} astrology={astrologyData} />
                </div>
              )}

              {page === 'fortune' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <CalendarDays className="text-indigo-600" /> {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} 运势分析报告
                  </h2>
                  
                  {aiLoading && !fortuneData ? (
                    <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-6">
                      <div className="w-16 h-16 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin" />
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-gray-800">正在为您推算今日运势...</h3>
                        <p className="text-gray-500">AI 正在结合您的八字与星盘进行综合推演</p>
                      </div>
                    </div>
                  ) : fortuneData ? (
                    <>
                      {/* Summary Card */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">今日概览</h3>
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold">
                              <Sparkles size={16} />
                              幸运色：{fortuneData.luckyColor}
                            </div>
                          </div>
                          <p className="text-gray-600 leading-relaxed text-lg">
                            {fortuneData.summary}
                          </p>
                          <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                              <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">宜 (Suggestion)</p>
                              <p className="text-sm text-green-800 font-medium">{fortuneData.suggestion}</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                              <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">忌 (Avoid)</p>
                              <p className="text-sm text-red-800 font-medium">{fortuneData.avoid}</p>
                            </div>
                          </div>
                        </div>

                        {/* Overall Score Circle */}
                        <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-xl text-white flex flex-col items-center justify-center text-center space-y-4">
                          <p className="text-indigo-100 font-medium">今日综合指数</p>
                          <div className="relative">
                            <svg className="w-32 h-32 transform -rotate-90">
                              <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-white/10"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={364.4}
                                strokeDashoffset={364.4 * (1 - fortuneData.overallScore / 100)}
                                strokeLinecap="round"
                                className="text-white"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl font-black">{fortuneData.overallScore}</span>
                            </div>
                          </div>
                          <p className="text-sm text-indigo-100/80">运势处于{fortuneData.overallScore > 80 ? '极佳' : fortuneData.overallScore > 60 ? '良好' : '平稳'}状态</p>
                        </div>
                      </div>

                      {/* Detailed Scores */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                          { label: '爱情', score: fortuneData.loveScore, color: 'from-pink-500 to-rose-500' },
                          { label: '财富', score: fortuneData.wealthScore, color: 'from-amber-400 to-orange-500' },
                          { label: '事业', score: fortuneData.careerScore, color: 'from-blue-500 to-indigo-500' },
                          { label: '学习', score: fortuneData.studyScore, color: 'from-emerald-400 to-teal-500' },
                          { label: '人际', score: fortuneData.interpersonalScore, color: 'from-violet-400 to-purple-500' },
                        ].map((item, idx) => (
                          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                            <p className="text-sm font-bold text-gray-500">{item.label}</p>
                            <div className="flex items-end justify-between">
                              <span className="text-2xl font-black text-gray-800">{item.score}</span>
                              <span className="text-xs text-gray-400">/ 100</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.score}%` }}
                                transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                                className={`h-full bg-gradient-to-r ${item.color}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-6 text-gray-400">
                      <CalendarDays size={64} className="opacity-20" />
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-gray-800">运势分析暂不可用</h3>
                        <p>由于 API 配额限制，今日运势推算失败。您可以稍后再试。</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-gray-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-100/50 rounded-full blur-[120px]" />
      </div>

      <main className="relative container mx-auto px-2 md:px-4">
        {error && page !== 'home' && (
          <div className="max-w-4xl mx-auto mt-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-800 animate-in fade-in slide-in-from-top-4">
            <Sparkles className="shrink-0 mt-0.5" size={18} />
            <div className="text-sm">
              <p className="font-bold">AI 分析暂不可用</p>
              <p>{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-amber-400 hover:text-amber-600">
              <ChevronLeft className="rotate-90" size={18} />
            </button>
          </div>
        )}
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="relative py-6 text-center text-gray-400 text-sm border-t border-gray-100 mt-6">
        <p>© 2026 AI 命理分析平台 | 探索命运的智慧</p>
        <p className="mt-2">本平台分析仅供娱乐参考，请理性对待人生决策</p>
      </footer>
    </div>
  );
}
