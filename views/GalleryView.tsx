
import React from 'react';
import { GeneratedImage } from '../types';

interface GalleryViewProps {
  history: GeneratedImage[];
}

const GalleryView: React.FC<GalleryViewProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-1000">
        <div className="w-24 h-24 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] flex items-center justify-center text-slate-200 dark:text-zinc-800 shadow-xl transition-all duration-700">
           <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">素材库空空如也</h3>
          <p className="text-slate-400 dark:text-zinc-500 text-sm font-bold uppercase tracking-widest">开始您的第一次创作，作品将自动存储于此。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
       <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">作品档案馆</h1>
          <p className="text-slate-500 dark:text-zinc-500 text-sm font-medium">浏览并管理您所有的历史生成记录。</p>
        </div>
        <div className="px-5 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest shadow-sm">
          {history.length} ITEMS SAVED
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="group relative bg-white dark:bg-black rounded-[2rem] overflow-hidden border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10"
          >
            <div className="aspect-square w-full relative overflow-hidden bg-slate-50 dark:bg-zinc-900 transition-colors duration-700">
              <img 
                src={item.url} 
                alt={item.prompt} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000" 
              />
              <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 backdrop-blur-[2px]">
                <p className="text-xs text-white font-medium line-clamp-3 mb-4 leading-relaxed italic">"{item.prompt}"</p>
                <div className="flex gap-2">
                   <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = item.url;
                      link.download = `gemini-creation-${item.id}.png`;
                      link.click();
                    }}
                    className="flex-1 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-100 active:scale-95"
                  >
                    下载原图
                  </button>
                </div>
              </div>
            </div>
            <div className="p-5 flex items-center justify-between bg-white dark:bg-black transition-colors duration-700">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  {item.model.includes('pro') ? 'PRO ENGINE' : 'FLASH CORE'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full border border-slate-100 dark:border-zinc-800 flex items-center justify-center">
                 <svg className="w-4 h-4 text-slate-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryView;
