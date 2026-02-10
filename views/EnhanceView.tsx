
import React, { useState, useRef } from 'react';
import { GeminiService } from '../geminiService';
import { GeneratedImage } from '../types';

interface EnhanceViewProps {
  onImageGenerated: (img: GeneratedImage) => void;
  onProError?: () => void;
}

const EnhanceView: React.FC<EnhanceViewProps> = ({ onImageGenerated, onProError }) => {
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

  const handleEnhance = async () => {
    if (!sourceImage) return;

    setLoading(true);
    setError(null);
    try {
      const imageUrl = await GeminiService.upscaleImage(sourceImage);
      setResult(imageUrl);
      onImageGenerated({
        id: Date.now().toString(),
        url: imageUrl,
        prompt: "4K Super-Resolution Enhancement",
        timestamp: Date.now(),
        model: 'gemini-3-pro-image-preview'
      });
    } catch (err: any) {
      console.error(err);
      if (err.message === 'PRO_KEY_REQUIRED') {
        setError('4K 高清放大需要付费 API 密钥。');
        if (onProError) onProError();
      } else {
        setError('放大图片失败，请检查网络或 API 限制。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <header>
        <h1 className="text-4xl font-black mb-3 text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <span className="w-2 h-10 bg-indigo-600 rounded-full inline-block shadow-lg shadow-indigo-500/20" />
          4K 高清放大
        </h1>
        <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">采用 nano banana pro 引擎，利用深度学习模型将低分辨率图像无损放大至 4K，修复细节并消除噪点。</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">原始图片 (Original Image)</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative group aspect-square rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center bg-white dark:bg-black ${
              sourceImage 
              ? 'border-indigo-500/30' 
              : 'border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-zinc-700'
            } shadow-sm`}
          >
            {sourceImage ? (
              <>
                <img src={sourceImage} alt="Source" className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <p className="text-white text-[10px] font-black uppercase tracking-widest">点击更换图片</p>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto text-slate-300 dark:text-zinc-700">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">上传待放大的素材</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          <button
            onClick={handleEnhance}
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
                <span className="uppercase tracking-widest text-xs">4K 渲染中...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                </svg>
                <span className="uppercase tracking-widest text-xs">执行 4K 高清放大</span>
              </>
            )}
          </button>
          
          {error && <p className="text-[10px] text-red-500 font-bold text-center animate-bounce">{error}</p>}
        </div>

        <div className="space-y-6">
          <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">4K 增强结果 (Enhanced Result)</label>
          <div className="aspect-square w-full rounded-[2.5rem] bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden relative shadow-2xl transition-all duration-700 group">
            {result ? (
              <>
                <img src={result} alt="Enhanced Result" className="w-full h-full object-contain p-6" />
                <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
                  <button onClick={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = `4k-enhanced-${Date.now()}.png`;
                    link.click();
                  }} className="px-8 py-4 bg-white text-slate-900 rounded-3xl hover:scale-110 transition-transform shadow-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    保存 4K 高清原图
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto transition-all shadow-inner">
                  <svg className="w-10 h-10 text-slate-100 dark:text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-300 dark:text-zinc-700 text-[10px] font-black tracking-widest uppercase">等待 4K 任务执行</p>
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
                  <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-lg">PRO 引擎增强中</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-tighter">正在计算超级像素并修复边缘纹理</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhanceView;
