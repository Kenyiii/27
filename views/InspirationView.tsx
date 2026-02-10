
import React, { useState } from 'react';
import { GeminiService } from '../geminiService';
import { InspirationItem } from '../types';

const InspirationView: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const results = await GeminiService.getInspiration(keyword);
      setItems(results);
      if (results.length === 0) {
        setError("未发现相关灵感，请尝试更换关键词。");
      }
    } catch (err) {
      setError("搜索失败，请检查网络或 API 配置。");
    } finally {
      setLoading(false);
    }
  };

  const trendingTags = ['现代地毯', '极简室内', '波希米亚风格', '抽象图案', '北欧设计', '复古装饰'];

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">灵感来源</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">智能采集 Pinterest 全球美学趋势，为您的创作注入新鲜动力。</p>
        </div>
        <form onSubmit={handleSearch} className="relative group w-full max-w-md">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜寻您的灵感主题..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl text-sm font-bold shadow-xl transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-zinc-600 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button type="submit" disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
          </button>
        </form>
      </header>

      <div className="flex flex-wrap gap-2">
        {trendingTags.map(tag => (
          <button
            key={tag}
            onClick={() => { setKeyword(tag); setTimeout(handleSearch, 0); }}
            className="px-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-full text-[10px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all"
          >
            #{tag}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-8 text-center bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-[2.5rem] animate-in zoom-in-95">
          <p className="text-sm font-bold text-red-500 uppercase tracking-widest">{error}</p>
        </div>
      )}

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {items.map((item, idx) => (
            <a
              key={idx}
              href={item.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-white dark:bg-black rounded-[2rem] overflow-hidden border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 block"
            >
              <div className="p-8 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 dark:text-zinc-700 uppercase tracking-widest">Pinterest Link</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium mt-2 line-clamp-3">
                    {item.uri}
                  </p>
                </div>
              </div>
              <div className="px-8 py-5 border-t border-slate-50 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950 flex items-center justify-between">
                 <span className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Explore Trends</span>
                 <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      ) : !loading && !error && (
        <div className="h-[40vh] flex flex-col items-center justify-center text-center space-y-6">
           <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] flex items-center justify-center text-slate-200 dark:text-zinc-800">
             <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
           </div>
           <p className="text-slate-400 dark:text-zinc-600 text-sm font-black uppercase tracking-[0.2em]">输入关键词开始搜寻美学灵感</p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800 rounded-[2rem] h-64 animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
};

export default InspirationView;
