import React, { useState, useEffect } from 'react';
import { BackgroundMode, BgImageStyle } from '../types';

const FONTS = [
  { name: 'Sans Serif', value: 'ui-sans-serif, system-ui, sans-serif' },
  { name: 'Serif', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  { name: 'Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
  { name: 'Cursive', value: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif' },
  { name: 'Fantasy', value: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif' },
];

interface ClockWidgetProps {
    isMinimized: boolean;
    onToggleMinimize: () => void;
    bgMode: BackgroundMode;
    bgImageStyle?: BgImageStyle; 
    isUIHidden?: boolean; 
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({ isMinimized, onToggleMinimize, bgMode, bgImageStyle, isUIHidden = false }) => {
  const [time, setTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [isClosing, setIsClosing] = useState(false); 
  const [internalMinimized, setInternalMinimized] = useState(isMinimized); 

  const [userText, setUserText] = useState('');
  const [tempText, setTempText] = useState('');
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
  const [fontSize, setFontSize] = useState(14); 
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  
  const [hideInCleanMode, setHideInCleanMode] = useState(false);

  useEffect(() => {
      if (!isMinimized) {
          setInternalMinimized(false);
          setIsClosing(false);
      } else if (!isClosing && !internalMinimized) {
          setInternalMinimized(true);
      }
  }, [isMinimized]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (date: Date) => date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const getDayName = (date: Date) => date.toLocaleDateString('tr-TR', { weekday: 'long' });

  const handleMinimizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSettings(false);
    setIsClosing(true); 
    // Animasyon süresi 0.9 saniye (900ms) ile senkronize
    setTimeout(() => {
        setInternalMinimized(true);
        setIsClosing(false);
        onToggleMinimize(); 
    }, 900);
  };

  const handleMaximize = (e: React.MouseEvent) => {
      e.stopPropagation();
      setInternalMinimized(false); 
      onToggleMinimize(); 
  };

  const handleSettingsOpen = (e: React.MouseEvent) => {
      e.stopPropagation();
      setTempText(userText); 
      setShowSettings(true);
  };

  const saveSettings = () => {
      setUserText(tempText);
      setShowSettings(false);
  };

  const isEffectiveDarkMode = bgMode === 'dark' || (bgMode === 'image' && bgImageStyle === 'contain');
  const isContrastMode = !isEffectiveDarkMode && bgMode !== 'light';
  
  let glassClass = "";
  let textClass = ""; 
  let subTextClass = ""; 
  let iconClass = "";

  if (isEffectiveDarkMode) {
      glassClass = "glass-panel-light";
      textClass = "text-transparent bg-gradient-to-b from-white to-white/70 bg-clip-text";
      subTextClass = "text-gray-300";
      iconClass = "text-white/80 hover:text-white";
  } else if (bgMode === 'light') {
      glassClass = "glass-panel-dark";
      textClass = "text-transparent bg-gradient-to-b from-white to-white/70 bg-clip-text";
      subTextClass = "text-gray-300";
      iconClass = "text-white/80 hover:text-white";
  } else {
      glassClass = "glass-panel-light";
      textClass = "text-black drop-shadow-none"; 
      subTextClass = "text-black/70";
      iconClass = "text-black/60 hover:text-black border-black/20";
  }

  const minimizedClass = isContrastMode ? "minimized-light" : (bgMode === 'light' ? "minimized-dark" : "minimized-light");
  const minimizedIconColor = isContrastMode ? "stroke-black" : "stroke-white";
  const shouldHide = isUIHidden && hideInCleanMode;
  const hideClass = shouldHide ? "opacity-0 -translate-y-full pointer-events-none" : "opacity-100 translate-y-0";

  return (
    <>
      <style>{`
        @keyframes marquee-one-way { 0% { transform: translateX(0%); } 100% { transform: translateX(-100%); } }
        .marquee-container { display: flex; overflow: hidden; white-space: nowrap; mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
        .animate-marquee-one-way { display: inline-block; padding-left: 100%; animation: marquee-one-way 8s linear infinite; }
        
        /* Maximize Animasyonu - 0.9sn ile uyumlu olması için biraz hızlandırdık */
        @keyframes open-slow { 0% { opacity: 0; transform: scale(0.6) translateY(-20px) rotateX(20deg); filter: blur(10px); } 60% { opacity: 1; transform: scale(1.02) translateY(5px); filter: blur(0px); } 100% { opacity: 1; transform: scale(1) translateY(0) rotateX(0deg); } }
        .animate-open-slow { animation: open-slow 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        
        /* Minimize Animasyonu - Tam 0.9sn */
        @keyframes close-slow { 0% { opacity: 1; transform: scale(1); filter: blur(0px); } 100% { opacity: 0; transform: scale(0.8) translateY(-20px); filter: blur(10px); } }
        .animate-close-slow { animation: close-slow 0.9s cubic-bezier(0.32, 0, 0.67, 0) forwards; pointer-events: none; }
        
        @keyframes menu-pop-fast { 0% { opacity: 0; transform: scale(0.8) translateY(-10px); filter: blur(4px); } 60% { transform: scale(1.05) translateY(0); filter: blur(0px); } 100% { opacity: 1; transform: scale(1); } }
        .animate-config-pop { animation: menu-pop-fast 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        
        @keyframes vfx-entry { 0% { opacity: 0; transform: translateY(15px); filter: blur(5px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0px); } }
        .vfx-item { opacity: 0; animation: vfx-entry 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .delay-5 { animation-delay: 0.5s; }
        
        .glass-panel-light { background: linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05)); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0px 15px 35px rgba(0, 0, 0, 0.2); }
        .minimized-light { background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 0 15px rgba(255, 255, 255, 0.2); }
        .glass-panel-dark { background: linear-gradient(145deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0px 15px 35px rgba(0, 0, 0, 0.4); }
        .minimized-dark { background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 0 15px rgba(0, 0, 0, 0.3); }
      `}</style>

      <div className={`absolute top-6 left-6 z-[60] origin-top-left select-none transition-all duration-500 ${hideClass}`}>
        {internalMinimized ? (
          <div onClick={handleMaximize} className={`w-12 h-12 rounded-full cursor-pointer flex items-center justify-center group ${minimizedClass} hover:scale-110 transition-transform duration-300`}>
              <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`drop-shadow-md group-hover:rotate-180 transition-transform duration-500 ${minimizedIconColor}`}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <div className="absolute inset-0 bg-blue-500/30 blur-md rounded-full -z-10 animate-pulse"></div>
              </div>
          </div>
        ) : (
          <div className={`relative w-min max-w-full rounded-3xl p-5 group ${glassClass} ${isClosing ? 'animate-close-slow' : 'animate-open-slow'}`}>
             <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 scale-90">
                <button onClick={handleSettingsOpen} className={`p-1.5 rounded-full backdrop-blur-md shadow-lg transition-colors ${isContrastMode ? 'bg-white/60 border border-black/10 text-black hover:bg-white' : 'bg-black/60 border border-white/20 text-white/80 hover:text-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
                <button onClick={handleMinimizeStart} className={`p-1.5 rounded-full backdrop-blur-md shadow-lg transition-colors ${isContrastMode ? 'bg-white/60 border border-black/10 text-black hover:bg-white' : 'bg-black/60 border border-white/20 text-white/80 hover:text-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
             </div>
             <div className="flex flex-col items-center">
                 <div className={`font-mono tracking-tighter mb-1 text-center transition-all duration-300 whitespace-nowrap pr-4 ${textClass} vfx-item delay-1`} style={{ fontFamily: selectedFont, fontSize: `${fontSize * 3.0}px`, fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal', lineHeight: 1.0 }}>{formatTime(time)}</div>
                 <div className={`flex flex-col items-center border-t pt-2 mb-1 w-full transition-all duration-300 whitespace-nowrap ${isContrastMode ? 'border-black/10' : 'border-white/10'} vfx-item delay-2`}>
                    <span className={`font-medium tracking-wide ${textClass} opacity-90`} style={{ fontFamily: selectedFont, fontSize: `${Math.max(10, fontSize * 0.9)}px`, fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal' }}>{getDayName(time)}</span>
                    <span className={subTextClass} style={{ fontFamily: selectedFont, fontSize: `${Math.max(9, fontSize * 0.8)}px`, fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal' }}>{formatDate(time)}</span>
                 </div>
                 {userText && (
                     <div className={`relative border-t pt-2 mt-1 max-w-[220px] ${isContrastMode ? 'border-black/10' : 'border-white/10'} vfx-item delay-3`}>
                         {userText.length > 20 ? (
                             <div className="w-full overflow-hidden marquee-container"><div className="animate-marquee-one-way"><span className="whitespace-nowrap px-4" style={{ fontFamily: selectedFont, fontSize: `${fontSize}px`, fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal', color: isContrastMode ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)' }}>{userText}</span></div></div>
                         ) : (
                             <div className="text-center w-full overflow-hidden text-ellipsis"><span className="whitespace-nowrap" style={{ fontFamily: selectedFont, fontSize: `${fontSize}px`, fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal', color: isContrastMode ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)' }}>{userText}</span></div>
                         )}
                     </div>
                 )}
             </div>
          </div>
        )}
      </div>

      {showSettings && (
        <div className="absolute top-20 left-6 z-[70] w-72 bg-[#111]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-config-pop" onPointerDown={(e) => e.stopPropagation()}>
            <h4 className="text-xs font-mono uppercase text-gray-500 mb-4 tracking-widest border-b border-white/10 pb-2 vfx-item delay-1">Widget Ayarları</h4>
            
            {/* Önizleme */}
            <div className="mb-5 p-4 bg-gradient-to-br from-white/10 to-transparent rounded-xl border border-white/10 text-center min-h-[60px] flex flex-col items-center justify-center vfx-item delay-2">
                 <span className="pr-2" style={{ fontFamily: selectedFont, fontSize: `${fontSize}px`, fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal', color: 'white' }}>12:34 - Metin</span>
            </div>

            {/* Font Selection */}
            <div className="mb-4 vfx-item delay-3">
                <label className="text-xs text-gray-400 block mb-1.5 font-medium">Yazı Tipi</label>
                <div className="relative">
                    <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-lg text-sm text-white p-2.5 outline-none cursor-pointer">
                        {FONTS.map(f => (<option key={f.name} value={f.value} className="bg-gray-900 text-white py-2">{f.name}</option>))}
                    </select>
                </div>
            </div>

            {/* Font Options */}
            <div className="flex gap-3 mb-4 vfx-item delay-3">
                <div className="flex-1"><label className="text-xs text-gray-400 block mb-1.5 font-medium flex justify-between"><span>Boyut</span><span className="text-blue-400">{fontSize}px</span></label><input type="range" min="10" max="20" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-lg cursor-pointer accent-blue-500"/></div>
                <div className="flex items-end gap-1"><button onClick={() => setIsBold(!isBold)} className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-sm transition-all ${isBold ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>B</button><button onClick={() => setIsItalic(!isItalic)} className={`w-9 h-9 rounded-lg border flex items-center justify-center italic text-sm transition-all ${isItalic ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>I</button></div>
            </div>

            {/* User Input */}
            <div className="mb-4 vfx-item delay-4"><label className="text-xs text-gray-400 block mb-1.5 font-medium">Özel Metin</label><input type="text" value={tempText} onChange={(e) => setTempText(e.target.value)} placeholder="..." className="w-full bg-black/40 border border-white/20 rounded-lg text-sm text-white p-2.5 outline-none focus:bg-black/60"/></div>

            {/* Clean Mode Toggle */}
            <div className="mb-5 flex items-center justify-between border-t border-white/10 pt-4 vfx-item delay-5">
                <span className="text-xs text-gray-400 font-medium">Temiz Modda Gizle</span>
                <button onClick={() => setHideInCleanMode(!hideInCleanMode)} className={`w-10 h-5 rounded-full relative transition-colors ${hideInCleanMode ? 'bg-blue-600' : 'bg-white/10'}`}><div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${hideInCleanMode ? 'translate-x-5' : 'translate-x-0'}`} /></button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-white/10 vfx-item delay-5">
                <button onClick={() => setShowSettings(false)} className="flex-1 py-2.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:text-white transition-colors">İptal</button>
                <button onClick={saveSettings} className="flex-1 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transition-all">Uygula</button>
            </div>
        </div>
      )}
    </>
  );
};