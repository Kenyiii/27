import React, { useState, useEffect, useRef } from 'react';
import { AppView, GeneratedImage } from './types';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import GeneratorView from './views/GeneratorView';
import EditorView from './views/EditorView';
import ExtractorView from './views/ExtractorView';
import GalleryView from './views/GalleryView';
import InspirationView from './views/InspirationView';
import EnhanceView from './views/EnhanceView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.EDIT);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isProMode, setIsProMode] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const checkProStatus = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsProMode(hasKey);
      }
    };
    checkProStatus();
  }, []);

  const addImageToHistory = (img: GeneratedImage) => {
    setHistory(prev => [img, ...prev]);
  };

  const handleOpenProKey = () => {
    setIsKeyModalOpen(true);
  };

  const triggerKeySelection = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setIsProMode(true);
      setIsKeyModalOpen(false);
    }
  };

  const handleProError = () => {
    setIsProMode(false);
    if (window.aistudio?.openSelectKey) {
      window.aistudio.openSelectKey();
    }
  };

  // 用于触发 EditorView 中的生图逻辑
  const handleNavbarKeyAction = () => {
    if (currentView !== AppView.EDIT) {
      setCurrentView(AppView.EDIT);
      // 给一点渲染时间后触发
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('TRIGGER_GENERATE_ORIGINAL'));
      }, 100);
    } else {
      window.dispatchEvent(new CustomEvent('TRIGGER_GENERATE_ORIGINAL'));
    }
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen w-full transition-all duration-700`}>
      <div className="flex flex-col h-full bg-white dark:bg-black text-slate-900 dark:text-slate-100 transition-colors duration-700 overflow-hidden">
        <Navbar onKeyClick={handleNavbarKeyAction} onOpenConfig={handleOpenProKey} />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar 
            currentView={currentView} 
            setView={setCurrentView} 
          />
          
          <main className="flex-1 relative overflow-y-auto bg-transparent transition-colors duration-700">
            <div className="max-w-7xl mx-auto p-8 lg:p-12">
              {currentView === AppView.GENERATE && (
                <GeneratorView onImageGenerated={addImageToHistory} isProMode={isProMode} onProError={handleProError} />
              )}
              {currentView === AppView.INSPIRATION && (
                <InspirationView />
              )}
              {currentView === AppView.EXTRACT && (
                <ExtractorView onImageGenerated={addImageToHistory} />
              )}
              {currentView === AppView.EDIT && (
                <EditorView onImageGenerated={addImageToHistory} />
              )}
              {currentView === AppView.ENHANCE && (
                <EnhanceView onImageGenerated={addImageToHistory} onProError={handleProError} />
              )}
              {currentView === AppView.GALLERY && (
                <GalleryView history={history} />
              )}
            </div>
          </main>
        </div>

        {isKeyModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/95 backdrop-blur-md transition-all duration-700" onClick={() => setIsKeyModalOpen(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-tighter">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  API 配置
                </h3>
                <button onClick={() => setIsKeyModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">配置状态</label>
                  <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl text-xs font-mono text-indigo-600 dark:text-indigo-400 flex items-center justify-between shadow-inner">
                    <span>{isProMode ? 'PRO ENGINE ACTIVE' : 'STANDARD ENGINE'}</span>
                    <div className={`w-2 h-2 rounded-full ${isProMode ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'} animate-pulse`} />
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                    激活付费密钥以解锁高精度模型与 4K 生成。请确保选择来自已启用计费功能的 GCP 项目的 API 密钥。
                    详见 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-bold hover:text-indigo-500 transition-colors">计费文档 (Billing Docs)</a>。
                  </p>
                  <button 
                    onClick={triggerKeySelection}
                    className="w-full py-5 bg-slate-900 dark:bg-indigo-600 hover:opacity-90 text-white rounded-[1.5rem] font-black transition-all shadow-xl shadow-indigo-500/10 active:scale-95"
                  >
                    选择并激活付费密钥
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <footer className="h-8 bg-white dark:bg-black border-t border-slate-200 dark:border-zinc-900 flex items-center px-8 justify-between text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest transition-all duration-700">
          <div className="flex gap-8">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
              Build 2025.04.12
            </span>
            <span>Gemini Visual Engine v2.0</span>
          </div>
          <div className="flex items-center gap-6">
            <span className={isProMode ? 'text-indigo-600 dark:text-indigo-400' : ''}>
              Status: {isProMode ? 'Professional' : 'Standard Edition'}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;