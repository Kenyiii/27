import React from 'react';

interface NavbarProps {
  onKeyClick?: () => void;
  onOpenConfig?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onKeyClick, onOpenConfig }) => {
  return (
    <nav className="h-20 px-8 grid grid-cols-3 items-center bg-white dark:bg-black border-b border-slate-200 dark:border-zinc-900 transition-all duration-700">
      {/* Left Column: Empty to maintain center alignment */}
      <div className="flex items-center justify-start">
        <button 
          onClick={onOpenConfig}
          className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
        >
          API Config
        </button>
      </div>

      {/* Center Column: Brand Name */}
      <div className="flex items-center justify-center">
        <span className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-[0.5em] select-none">
          ZHILI
        </span>
      </div>

      {/* Right Column: Key-shaped Action Icon */}
      <div className="flex items-center justify-end">
        <button 
          onClick={onKeyClick}
          aria-label="Generate Original Carpet"
          className="group p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all shadow-sm active:scale-90"
        >
          <svg 
            className="w-6 h-6 text-slate-600 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.2} 
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" 
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;