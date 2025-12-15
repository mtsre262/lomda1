import React from 'react';
import { Sun, Moon, ZoomIn, ZoomOut, Monitor, X } from 'lucide-react';

export interface ViewSettingsState {
  zoom: number;
  brightness: number;
  language: 'ar' | 'en' | 'he';
  theme: 'dark' | 'light';
}

interface ViewMenuProps {
  settings: ViewSettingsState;
  onUpdate: (newSettings: Partial<ViewSettingsState>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewMenu: React.FC<ViewMenuProps> = ({ settings, onUpdate, isOpen, onClose }) => {
  const languages = [
    { code: 'ar', label: 'العربية' },
    { code: 'en', label: 'English' },
    { code: 'he', label: 'עברית' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-[#0a0a12] border border-electro-primary/30 rounded-2xl w-96 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-electro-primary/10 p-4 border-b border-electro-primary/20 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white font-bold">
                <Monitor className="w-5 h-5 text-electro-glow" />
                <span>إعدادات العرض (View)</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Theme */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Theme (المظهر)</label>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => onUpdate({ theme: 'dark' })}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${settings.theme === 'dark' ? 'bg-electro-primary text-white border-electro-glow' : 'bg-gray-800 text-gray-400 border-gray-700'}`}
                    >
                        <Moon className="w-4 h-4" /> Dark
                    </button>
                    <button 
                        onClick={() => onUpdate({ theme: 'light' })}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${settings.theme === 'light' ? 'bg-white text-black border-gray-200' : 'bg-gray-800 text-gray-400 border-gray-700'}`}
                    >
                        <Sun className="w-4 h-4" /> Light
                    </button>
                </div>
            </div>

            {/* Zoom */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Zoom (التقريب)</label>
                <div className="flex items-center gap-4 bg-black/20 p-2 rounded-xl border border-gray-800">
                    <button 
                        onClick={() => onUpdate({ zoom: Math.max(0.5, settings.zoom - 0.1) })}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-300"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <div className="flex-1 text-center font-mono text-electro-glow font-bold">
                        {Math.round(settings.zoom * 100)}%
                    </div>
                    <button 
                        onClick={() => onUpdate({ zoom: Math.min(2, settings.zoom + 0.1) })}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-300"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Brightness */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Brightness (السطوع)</label>
                <input 
                    type="range" 
                    min="50" 
                    max="150" 
                    value={settings.brightness}
                    onChange={(e) => onUpdate({ brightness: parseInt(e.target.value) })}
                    className="w-full accent-electro-glow h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            {/* Language */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Language (اللغة)</label>
                <div className="grid grid-cols-3 gap-2">
                    {languages.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => onUpdate({ language: lang.code as any })}
                            className={`py-2 px-1 text-sm rounded-lg border transition-all ${settings.language === lang.code ? 'bg-electro-secondary/30 text-white border-electro-secondary' : 'bg-gray-800/50 text-gray-400 border-transparent hover:bg-gray-800'}`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};