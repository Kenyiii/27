
import React, { useState, useRef } from 'react';
import { GeminiService } from '../geminiService';
import { AspectRatio, GeneratedImage } from '../types';

interface GeneratorViewProps {
  onImageGenerated: (img: GeneratedImage) => void;
  isProMode: boolean;
  onProError?: () => void;
}

const GeneratorView: React.FC<GeneratorViewProps> = ({ onImageGenerated, isProMode, onProError }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
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
          setReferenceImage(res);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      // Use the isProMode flag to dynamically switch between flash and pro image models.
      // Now also passing the referenceImage if it exists.
      const imageUrl = await GeminiService.generateImage(prompt, aspectRatio, isProMode, referenceImage);
      setResult(imageUrl);
      onImageGenerated({
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        timestamp: Date.now(),
        // Correctly log the model used for history tracking.
        model: isProMode ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
      });
    } catch (err: any) {
      console.error(err);
      if (err.message === 'PRO_KEY_REQUIRED') {
        setError('专业模式需要付费 API 密钥，且需关联有效的结算账户。');
        if (onProError) {
          onProError();
        }
      } else {
        setError('生成图像失败，请检查网络或 API 限制。');
      }
    } finally {
      setLoading(false);
    }
  };

  const ratios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <header>
        <h1 className="text-4xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">灵感生图</h1>
        <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">利用 Gemini 2.5/3.0 的强大算力，将您的文字与参考图瞬间转化为艺术。</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          {/* Reference Image Section */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">参考图 (Optional Reference)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative group aspect-video rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${
                referenceImage 
                ? 'bg-white dark:bg-zinc-950 border-indigo-500/30' 
                : 'bg-slate-50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-zinc-700'
              }`}
            >
              {referenceImage ? (
                <>
                  <img src={referenceImage} alt="Reference" className="w-full h-full object-cover p-2 rounded-2xl" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <p className="text-white text-[10px] font-black uppercase tracking-widest">点击更换</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setReferenceImage(null);
                    }}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center mx-auto text-slate-400 dark:text-zinc-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">上传垫图素材</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">提示词 (Prompt)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：一个在数字云端中漂浮的复古式电话机，暖色调，3D 渲染，细节精美..."
              className="w-full h-40 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-300 dark:placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 resize-none transition-all duration-300 shadow-sm font-medium"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">画面纵横比 (Aspect Ratio)</label>
            <div className="grid grid-cols-5 gap-2.5">
              {ratios.map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={`py-3 rounded-2xl text-[11px] font-black border transition-all duration-300 ${
                    aspectRatio === r
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/20 translate-y-[-2px]'
                      : 'bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 hover:border-indigo-500/50 dark:hover:border-zinc-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className={`w-full py-5 rounded-3xl font-black flex items-center justify-center gap-3 transition-all duration-300 ${
              loading || !prompt.trim()
                ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed shadow-none'
                : 'bg-slate-900 dark:bg-indigo-600 text-white hover:opacity-90 active:scale-[0.98] shadow-2xl shadow-indigo-500/20'
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>渲染核心启动中...</span>
              </div>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>立即呈现艺术</span>
              </>
            )}
          </button>
          
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl animate-in fade-in zoom-in-95">
              <p className="text-[11px] text-red-600 dark:text-red-400 font-bold leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="aspect-square w-full rounded-[2.5rem] bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden relative shadow-2xl transition-all duration-700 group">
            {result ? (
              <>
                <img src={result} alt="Generated result" className="w-full h-full object-contain p-6" />
                <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
                  <button onClick={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = `creation-${Date.now()}.png`;
                    link.click();
                  }} className="px-8 py-4 bg-white text-slate-900 rounded-3xl hover:scale-110 transition-transform shadow-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    保存作品
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto transition-all shadow-inner">
                  <svg className="w-12 h-12 text-slate-200 dark:text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-400 dark:text-zinc-700 text-sm font-black tracking-widest uppercase">等待创意输入...</p>
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
                  <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-lg">正在捕捉像素</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-tighter">Gemini 多模态渲染引擎驱动</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratorView;
