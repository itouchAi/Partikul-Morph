import React, { useState, useRef } from 'react';

type PresetType = 'none' | 'electric' | 'fire' | 'water' | 'mercury' | 'disco';
type AudioMode = 'none' | 'file' | 'mic';

interface UIOverlayProps {
  onSubmit: (text: string) => void;
  onImageUpload: (imgSrc: string, useOriginalColors: boolean) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  onResetColors: () => void;
  isOriginalColors: boolean;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
  hasImage: boolean;
  depthIntensity: number;
  onDepthChange: (val: number) => void;
  // Ayarlar
  repulsionStrength: number;
  onRepulsionChange: (val: number) => void;
  repulsionRadius: number;
  onRadiusChange: (val: number) => void;
  particleCount: number;
  onParticleCountChange: (val: number) => void;
  particleSpacing: number;
  onSpacingChange: (val: number) => void;
  // Presetler
  activePreset: PresetType;
  onPresetChange: (preset: PresetType) => void;
  // Ses
  onAudioChange: (mode: AudioMode, url: string | null) => void;
  audioMode: AudioMode;
  // Reset
  onResetAll: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ 
  onSubmit, 
  onImageUpload,
  currentColor, 
  onColorChange,
  onResetColors,
  isOriginalColors,
  onInteractionStart,
  onInteractionEnd,
  hasImage,
  depthIntensity,
  onDepthChange,
  repulsionStrength,
  onRepulsionChange,
  repulsionRadius,
  onRadiusChange,
  particleCount,
  onParticleCountChange,
  particleSpacing,
  onSpacingChange,
  activePreset,
  onPresetChange,
  onAudioChange,
  audioMode,
  onResetAll
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savedColor, setSavedColor] = useState(currentColor);
  
  // Modals
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

  // Upload Refs & State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (inputValue.trim() === '') {
        onSubmit(''); 
      } else {
        onSubmit(inputValue);
      }
    }
  };

  const handleSpectrumMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const hue = x * 360;
    const lightness = (1 - y) * 100;

    const newColor = `hsl(${hue}, 100%, ${lightness}%)`;
    onColorChange(newColor);
  };

  const handleSpectrumClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const hue = x * 360;
    const lightness = (1 - y) * 100;
    const color = `hsl(${hue}, 100%, ${lightness}%)`;

    setSavedColor(color);
    onColorChange(color);
    setIsPaletteOpen(false);
    onInteractionEnd();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPendingImage(event.target.result as string);
          setShowImageModal(true);
          onInteractionStart();
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const url = URL.createObjectURL(file);
        onAudioChange('file', url);
        setShowAudioModal(false);
        onInteractionEnd();
    }
    if (audioInputRef.current) audioInputRef.current.value = '';
  }

  const confirmImageUpload = (useOriginal: boolean) => {
    if (pendingImage) {
      onImageUpload(pendingImage, useOriginal);
      setInputValue('');
    }
    setShowImageModal(false);
    setPendingImage(null);
    onInteractionEnd();
  };

  const handleCountChange = (val: number) => {
    const clamped = Math.max(22000, Math.min(30000, val));
    onParticleCountChange(clamped);
  };

  return (
    <>
      <style>{`
        @keyframes electric-pulse { 0% { box-shadow: 0 0 5px #0ff; border-color: #0ff; } 50% { box-shadow: 0 0 20px #0ff, 0 0 10px #fff; border-color: #fff; } 100% { box-shadow: 0 0 5px #0ff; border-color: #0ff; } }
        @keyframes fire-burn { 0% { box-shadow: 0 0 5px #f00; border-color: #f00; background: rgba(255,0,0,0.1); } 50% { box-shadow: 0 -5px 20px #ff0, 0 0 10px #f00; border-color: #ff0; background: rgba(255,50,0,0.3); } 100% { box-shadow: 0 0 5px #f00; border-color: #f00; background: rgba(255,0,0,0.1); } }
        @keyframes water-flow { 0% { border-radius: 4px; box-shadow: 0 0 5px #00f; border-color: #00f; } 50% { border-radius: 12px; box-shadow: 0 5px 15px #0af; border-color: #0af; } 100% { border-radius: 4px; box-shadow: 0 0 5px #00f; border-color: #00f; } }
        @keyframes mercury-blob { 0% { transform: scale(1); border-color: #aaa; background: rgba(200,200,200,0.2); } 50% { transform: scale(1.05); border-color: #fff; background: rgba(255,255,255,0.4); } 100% { transform: scale(1); border-color: #aaa; background: rgba(200,200,200,0.2); } }
        @keyframes disco-spin { 0% { border-color: #f00; box-shadow: 0 0 10px #f00; } 20% { border-color: #ff0; box-shadow: 0 0 10px #ff0; } 40% { border-color: #0f0; box-shadow: 0 0 10px #0f0; } 60% { border-color: #0ff; box-shadow: 0 0 10px #0ff; } 80% { border-color: #00f; box-shadow: 0 0 10px #00f; } 100% { border-color: #f0f; box-shadow: 0 0 10px #f0f; } }
        .preset-btn { transition: all 0.3s ease; }
        .preset-btn:hover { transform: scale(1.1); }
        .preset-electric:hover, .preset-electric.active { animation: electric-pulse 0.5s infinite; }
        .preset-fire:hover, .preset-fire.active { animation: fire-burn 1s infinite; }
        .preset-water:hover, .preset-water.active { animation: water-flow 2s infinite ease-in-out; }
        .preset-mercury:hover, .preset-mercury.active { animation: mercury-blob 3s infinite ease-in-out; }
        .preset-disco:hover, .preset-disco.active { animation: disco-spin 2s infinite linear; }
      `}</style>

      {/* SOL TARAFA PRESET MENÜSÜ */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-4"
           onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}>
          <button onClick={() => onPresetChange(activePreset === 'electric' ? 'none' : 'electric')} className={`preset-btn preset-electric w-12 h-12 border border-white/20 bg-black/50 backdrop-blur-md rounded flex items-center justify-center group ${activePreset === 'electric' ? 'active' : ''}`} title="Elektrik Efekti"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></button>
          <button onClick={() => onPresetChange(activePreset === 'fire' ? 'none' : 'fire')} className={`preset-btn preset-fire w-12 h-12 border border-white/20 bg-black/50 backdrop-blur-md rounded flex items-center justify-center group ${activePreset === 'fire' ? 'active' : ''}`} title="Ateş Efekti"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3 .5.7 1 1.3 2 1.5z"></path></svg></button>
          <button onClick={() => onPresetChange(activePreset === 'water' ? 'none' : 'water')} className={`preset-btn preset-water w-12 h-12 border border-white/20 bg-black/50 backdrop-blur-md rounded flex items-center justify-center group ${activePreset === 'water' ? 'active' : ''}`} title="Su Efekti"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg></button>
          <button onClick={() => onPresetChange(activePreset === 'mercury' ? 'none' : 'mercury')} className={`preset-btn preset-mercury w-12 h-12 border border-white/20 bg-black/50 backdrop-blur-md rounded flex items-center justify-center group ${activePreset === 'mercury' ? 'active' : ''}`} title="Civa Efekti"><div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-300 to-gray-600 border border-white/50"></div></button>
          <button onClick={() => onPresetChange(activePreset === 'disco' ? 'none' : 'disco')} className={`preset-btn preset-disco w-12 h-12 border border-white/20 bg-black/50 backdrop-blur-md rounded flex items-center justify-center group ${activePreset === 'disco' ? 'active' : ''}`} title="Disco Modu"><div className="w-5 h-5 rounded-full bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] border border-white/50 animate-spin" style={{ animationDuration: '3s' }}></div></button>
          {activePreset !== 'none' && (<div className="absolute top-full mt-2 left-0 w-full text-[10px] text-gray-500 text-center font-mono">ESC: İptal</div>)}
      </div>

      {/* Sol Alt Köşe: Talimatlar (Sabit) */}
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none select-none text-white/50 text-xs font-mono space-y-2">
        <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white/30 rounded grid place-items-center text-[10px]">L</div><span>Sol Tık: Dağıt</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white/30 rounded grid place-items-center text-[10px]">R</div><span>Sağ Tık: Döndür</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white/30 rounded grid place-items-center text-[10px]">M</div><span>Tekerlek: Yakınlaş</span></div>
      </div>

      {/* Sağ Üst Köşe: Ayarlar (Sabit) */}
      <div className="absolute top-6 right-6 z-30">
        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border border-white/20 text-white ${isSettingsOpen ? 'bg-white/20 rotate-90' : 'bg-white/5 hover:bg-white/10'}`} title="Ayarlar"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
        {isSettingsOpen && (
          <div className="absolute top-12 right-0 w-64 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}>
            <h4 className="text-white/80 text-xs font-mono uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Konfigürasyon</h4>
            <div className="mb-5"><div className="flex justify-between text-xs text-gray-400 mb-1"><span>İmleç Gücü</span><span>{repulsionStrength}%</span></div><input type="range" min="0" max="100" value={repulsionStrength} onChange={(e) => onRepulsionChange(parseInt(e.target.value))} className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-300"/></div>
            <div className="mb-5"><div className="flex justify-between text-xs text-gray-400 mb-1"><span>İmleç Çapı</span><span>{repulsionRadius}%</span></div><input type="range" min="0" max="100" value={repulsionRadius} onChange={(e) => onRadiusChange(parseInt(e.target.value))} className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-300"/></div>
            <div className="mb-5"><div className="flex justify-between text-xs text-gray-400 mb-1"><span>Partikül Sayısı</span></div><div className="flex items-center gap-2"><button onClick={() => handleCountChange(particleCount - 2000)} className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10">-</button><input type="number" min="22000" max="30000" step="2000" value={particleCount} onChange={(e) => handleCountChange(parseInt(e.target.value) || 22000)} className="flex-1 h-8 bg-black/50 border border-white/10 rounded text-center text-white text-xs font-mono focus:outline-none focus:border-white/40"/><button onClick={() => handleCountChange(particleCount + 2000)} className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10">+</button></div><div className="text-[10px] text-gray-600 mt-1 text-center">Max: 30,000</div></div>
            <div className="mb-2"><div className="flex justify-between text-xs text-gray-400 mb-1"><span>Boşluk Oranı</span><span>{particleSpacing}</span></div><input type="range" min="0" max="50" value={particleSpacing} onChange={(e) => onSpacingChange(parseInt(e.target.value))} className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-300"/></div>
          </div>
        )}
      </div>

      {/* MODAL: Resim Seçimi */}
      {showImageModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
            <h3 className="text-white text-lg font-light mb-4">Görsel İşleme Seçeneği</h3>
            <p className="text-gray-400 text-sm mb-6">Partiküller görseli oluştururken hangi renkleri kullansın?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => confirmImageUpload(false)} className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white transition-all duration-200 group"><span className="font-medium">Tek Renk</span><span className="text-xs text-gray-500 block mt-1 group-hover:text-gray-400">Mevcut seçili palet rengi kullanılır</span></button>
              <button onClick={() => confirmImageUpload(true)} className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 hover:from-pink-500/30 hover:via-purple-500/30 hover:to-blue-500/30 border border-white/10 hover:border-white/30 text-white transition-all duration-200 group"><span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300">Orijinal Renkler</span><span className="text-xs text-gray-500 block mt-1 group-hover:text-gray-400">Görselin kendi renkleri kullanılır</span></button>
            </div>
            <button onClick={() => { setShowImageModal(false); setPendingImage(null); onInteractionEnd(); }} className="mt-6 text-gray-500 hover:text-white text-xs transition-colors">İptal Et</button>
          </div>
        </div>
      )}

      {/* MODAL: Ses Seçimi */}
      {showAudioModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
            <h3 className="text-white text-lg font-light mb-4">Ses Kaynağı Seçimi</h3>
            <p className="text-gray-400 text-sm mb-6">Ekolayzır efektini hangi kaynakla tetiklemek istersiniz?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => audioInputRef.current?.click()} className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white transition-all duration-200 group">
                <span className="font-medium">Müzik Dosyası Yükle</span>
                <span className="text-xs text-gray-500 block mt-1 group-hover:text-gray-400">Önerilen: Max 15 sn (mp3, wav)</span>
              </button>
              <button onClick={() => { onAudioChange('mic', null); setShowAudioModal(false); onInteractionEnd(); }} className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white transition-all duration-200 group">
                <span className="font-medium">Mikrofon Kullan</span>
                <span className="text-xs text-gray-500 block mt-1 group-hover:text-gray-400">Ortam sesiyle anlık tepki</span>
              </button>
            </div>
            <button onClick={() => { setShowAudioModal(false); onInteractionEnd(); }} className="mt-6 text-gray-500 hover:text-white text-xs transition-colors">İptal Et</button>
          </div>
        </div>
      )}
      
      {/* Sağ Orta: Derinlik Slider */}
      {hasImage && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-right-10 duration-500">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-full flex flex-col items-center shadow-xl">
                <div className="text-white/70 text-[10px] font-mono tracking-widest mb-4 rotate-180" style={{writingMode: 'vertical-rl'}}>DERİNLİK</div>
                <input type="range" min="0" max="10" step="0.1" value={depthIntensity} onChange={(e) => onDepthChange(parseFloat(e.target.value))} className="h-32 w-2 appearance-none bg-white/20 rounded-full outline-none vertical-slider cursor-pointer" style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any} onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd} />
                <div className="text-white/90 text-xs font-mono mt-3">{Math.round(depthIntensity * 10)}%</div>
            </div>
        </div>
      )}

      {/* Orta Alt: Kontroller */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center items-center pointer-events-none z-10 px-4">
        <div className="pointer-events-auto w-full max-w-lg relative group flex gap-2 items-center">
          
          {/* Renk Paleti Popup */}
          {isPaletteOpen && (
            <div className="absolute bottom-full right-0 translate-x-2 mb-2 bg-black/80 backdrop-blur-xl border border-white/20 p-2 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200 origin-bottom-right" onMouseEnter={() => onInteractionStart()} onMouseLeave={() => { onColorChange(savedColor); onInteractionEnd(); }}>
              <div className="text-white/60 text-[10px] mb-1 font-mono text-center">Renk Seçici</div>
              <div className="w-48 h-32 rounded-lg cursor-crosshair relative overflow-hidden shadow-inner border border-white/10" onMouseMove={handleSpectrumMove} onClick={handleSpectrumClick} style={{ background: 'white' }}>
                 <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }} />
                 <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%)' }} />
              </div>
            </div>
          )}

          {/* Gizli Inputlar */}
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          <input type="file" accept="audio/*" className="hidden" ref={audioInputRef} onChange={handleAudioSelect} />

          {/* Müzik Ekle Butonu */}
          <button
            onClick={() => { setShowAudioModal(true); onInteractionStart(); }}
            className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 border border-white/20 hover:border-white/50 text-white ${audioMode !== 'none' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-white/10 hover:bg-white/20'}`}
            title="Müzik/Ses Ekle"
            onMouseEnter={onInteractionStart}
            onMouseLeave={onInteractionEnd}
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
          </button>

          {/* Resim Ekle Butonu */}
          <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/50 text-white" title="Resim Yükle" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          </button>

          {/* Text Input */}
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} onFocus={() => onInteractionStart()} onBlur={() => onInteractionEnd()} placeholder="Metin yazın..." className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 rounded-full px-6 py-4 outline-none focus:bg-white/20 focus:border-white/50 transition-all duration-300 shadow-lg text-center font-light tracking-wide text-lg" />
          
          <div className="flex items-center gap-2">
            {/* Orijinal Renk Reset (Sadece Resimde) */}
            {hasImage && !isOriginalColors && (
              <button onClick={onResetColors} className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-gradient-to-tr from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 transition-all duration-300 border border-white/20 hover:border-white/50 text-white/80 hover:text-white animate-in fade-in zoom-in" title="Orijinal Renklere Dön" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
              </button>
            )}

            {/* Renk Paleti */}
            <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 transition-all duration-300 border-2 border-white/20 hover:border-white hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] z-20" title="Renk Paletini Aç" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}>
                <div className="w-6 h-6 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: currentColor }} />
            </button>

             {/* GLOBAL RESET BUTTON */}
             <button
                onClick={onResetAll}
                className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/30 transition-all duration-300 border border-white/20 hover:border-red-400 text-white/70 hover:text-red-200"
                title="Her Şeyi Sıfırla"
                onMouseEnter={onInteractionStart}
                onMouseLeave={onInteractionEnd}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg>
            </button>
          </div>
        </div>
        <div className="absolute -bottom-6 text-center text-[10px] text-gray-500 font-mono opacity-50">Küre moduna dönmek için boş Enter</div>
      </div>
    </>
  );
};