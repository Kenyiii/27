
import React, { useState, useRef } from 'react';
import { GeminiService } from '../geminiService';
import { GeneratedImage } from '../types';

interface ExtractorViewProps {
  onImageGenerated: (img: GeneratedImage) => void;
}

const ExtractorView: React.FC<ExtractorViewProps> = ({ onImageGenerated }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result;
        if (typeof res === 'string') {
          setSourceImage(res);
          setResult(null);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtract = async () => {
    if (!sourceImage) return;

    setLoading(true);
    setError(null);
    try {
      const prompt = "根据上传的图片，把图片中的地毯提取出来，并摆放成地毯正上方的垂直俯视图，并将图片高清放大";
      const imageUrl = await GeminiService.processImage(sourceImage, prompt, '1:1');
      setResult(imageUrl);
      onImageGenerated({
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        timestamp: Date.now(),
        model: 'gemini-2.5-flash-image'
      });
    } catch (err: any) {
      console.error(err);
      setError('提取地毯失败，请检查 API 配置或网络。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <header>
        <h1 className="text-4xl font-black mb-3 text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <span className="w-2 h-10 bg-indigo-600 rounded-full inline-block shadow-lg shadow-indigo-500/20" />
          地毯原图提取
        </h1>
        <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">从复杂的居家或实拍场景中智能识别地毯边界，并将其还原为高清平铺底稿。</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">待提取场景图 (Source Scene)</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative group aspect-[4/3] rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center bg-white dark:bg-black ${
              sourceImage 
              ? 'border-indigo-500/30' 
              : 'border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-zinc-700'
            } shadow-sm`}
          >
            {sourceImage ? (
              <>
                <img src={sourceImage} alt="Source" className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <p className="text-white text-[10px] font-black uppercase tracking-widest">点击更换场景</p>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto text-slate-300 dark:text-zinc-700">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">上传含地毯的场景图</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          <button
            onClick={handleExtract}
            disabled={loading || !sourceImage}
            className={`w-full py-5 rounded-3xl font-black flex items-center justify-center gap-3 transition-all duration-300 ${
              loading || !sourceImage
                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98] shadow-2xl shadow-indigo-500/20'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="uppercase tracking-widest text-xs">智能提取中...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="uppercase tracking-widest text-xs">执行地毯原图提取</span>
              </>
            )}
          </button>
          
          {error && <p className="text-[10px] text-red-500 font-bold text-center animate-bounce">{error}</p>}
        </div>

        <div className="space-y-6">
          <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">提取结果 (Extracted Pattern)</label>
          <div className="aspect-[1/1] w-full rounded-[2.5rem] bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden relative shadow-2xl transition-all duration-700 group">
            {result ? (
              <>
                <img src={result} alt="Extracted Result" className="w-full h-full object-contain p-6" />
                <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
                  <button onClick={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = `extracted-carpet-${Date.now()}.png`;
                    link.click();
                  }} className="px-8 py-4 bg-white text-slate-900 rounded-3xl hover:scale-110 transition-transform shadow-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    保存高清原图
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto transition-all shadow-inner">
                  <svg className="w-10 h-10 text-slate-100 dark:text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-slate-300 dark:text-zinc-700 text-[10px] font-black tracking-widest uppercase">等待分析执行</p>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 bg-white/70 dark:bg-black/90 backdrop-blur-md flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
                <div className="relative">
                   <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-10 h-10 bg-indigo-600 rounded-2xl animate-pulse shadow-xl shadow-indigo-500/40" />
                   </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-lg">AI 深度分割中</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-tighter">正在计算垂直透视角度并增强像素</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtractorView;
