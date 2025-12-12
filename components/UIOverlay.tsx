import React, { useState, useRef, useEffect } from 'react';
import { PresetType, AudioMode, BackgroundMode, BgImageStyle, ShapeType } from '../types';

const FONTS = [
  { name: 'Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
  { name: 'Sans Serif', value: 'ui-sans-serif, system-ui, sans-serif' },
  { name: 'Serif', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  { name: 'Cursive', value: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif' },
  { name: 'Fantasy', value: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif' },
];

interface UIOverlayProps {
  onSubmit: (text: string) => void;
  onImageUpload: (imgSrc: string, useOriginalColors: boolean) => void;
  onDrawingStart: () => void;
  onDrawingConfirm: () => void;
  isDrawing: boolean;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  // Canvas Rotation
  canvasRotation: [number, number, number];
  onRotateX: () => void;
  onRotateY: () => void;
  onRotateZ: () => void;
  
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
  
  particleSize: number;
  onParticleSizeChange: (val: number) => void;
  modelDensity: number;
  onModelDensityChange: (val: number) => void;

  activePreset: PresetType;
  onPresetChange: (preset: PresetType) => void;
  // Ses
  onAudioChange: (mode: AudioMode, url: string | null, title?: string) => void;
  audioMode: AudioMode;
  audioTitle?: string | null;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  // Reset
  onResetAll: () => void;
  onClearCanvas: () => void;
  
  // Arka Plan Tema Kontrolleri
  bgMode: BackgroundMode;
  onBgModeChange: (mode: BackgroundMode, data?: string) => void;
  onBgImageConfirm: (img: string, style: BgImageStyle) => void; 
  customBgColor: string;

  // Şekil Kontrol
  currentShape: ShapeType;
  onShapeChange: (shape: ShapeType) => void;
  
  // Widget Durumu
  isWidgetMinimized: boolean;

  // UI Gizleme
  isUIHidden: boolean;
  onToggleUI: () => void;

  // Sahne Gizleme
  isSceneVisible?: boolean;
  onToggleScene?: () => void;

  // Yeni Background Deck Props
  bgImages?: string[];
  onBgImagesAdd?: (images: string[]) => void;
  onBgImageSelect?: (img: string) => void;
  onBgImageStyleChange?: (style: BgImageStyle) => void;
  bgImageStyle?: BgImageStyle;
  onRemoveBgImage?: (img: string) => void;
  onBgPositionChange?: (pos: string) => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ 
  onSubmit, 
  onImageUpload,
  onDrawingStart,
  onDrawingConfirm,
  isDrawing,
  brushSize,
  onBrushSizeChange,
  canvasRotation,
  onRotateX,
  onRotateY,
  onRotateZ,
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
  particleSize,
  onParticleSizeChange,
  modelDensity,
  onModelDensityChange,
  activePreset,
  onPresetChange,
  onAudioChange,
  audioMode,
  audioTitle,
  isPlaying = true,
  onTogglePlay,
  onResetAll,
  onClearCanvas,
  bgMode,
  onBgModeChange,
  onBgImageConfirm,
  customBgColor,
  currentShape,
  onShapeChange,
  isWidgetMinimized,
  isUIHidden,
  onToggleUI,
  isSceneVisible = true,
  onToggleScene,
  bgImages = [],
  onBgImagesAdd,
  onBgImageSelect,
  onBgImageStyleChange,
  bgImageStyle = 'cover',
  onRemoveBgImage,
  onBgPositionChange
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isBgPaletteOpen, setIsBgPaletteOpen] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false); 
  const [savedColor, setSavedColor] = useState(currentColor);
  
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  
  const [useOriginalImageColors, setUseOriginalImageColors] = useState(true);

  // Müzik Çalar Ayarları
  const [showMusicSettings, setShowMusicSettings] = useState(false);
  const [musicFont, setMusicFont] = useState(FONTS[0].value);
  const [musicBold, setMusicBold] = useState(false);
  const [musicItalic, setMusicItalic] = useState(false);
  const [musicShowInCleanMode, setMusicShowInCleanMode] = useState(false);

  // Background Deck State
  const [deckIndex, setDeckIndex] = useState(0);
  const [deckShowSettings, setDeckShowSettings] = useState(false);
  const [deckHideInCleanMode, setDeckHideInCleanMode] = useState(false);
  const [animDirection, setAnimDirection] = useState<'next' | 'prev' | null>(null);
  
  // Expanded Deck Mode (Right Click)
  const [isDeckExpanded, setIsDeckExpanded] = useState(false);

  // Cropper Modal State
  const [showCropper, setShowCropper] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 50, y: 50 }); // % value
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);
  
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const isLightMode = bgMode === 'light';
  const isAnyMenuOpen = isSettingsOpen || isThemeMenuOpen || isShapeMenuOpen || isBgPaletteOpen || isPaletteOpen || showMusicSettings || deckShowSettings;

  const closeAllMenus = () => {
    setIsSettingsOpen(false);
    setIsThemeMenuOpen(false);
    setIsShapeMenuOpen(false);
    setIsBgPaletteOpen(false);
    setIsPaletteOpen(false);
    setShowMusicSettings(false);
    setDeckShowSettings(false);
    
    // Expand modunu kapat
    if (isDeckExpanded) setIsDeckExpanded(false);
    
    onInteractionEnd();
  };

  useEffect(() => {
    if (isDrawing) {
        closeAllMenus();
    }
  }, [isDrawing]);

  // Preload Images
  useEffect(() => {
      if (bgImages && bgImages.length > 0) {
          bgImages.forEach(src => {
              const img = new Image();
              img.src = src;
          });
      }
  }, [bgImages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (inputValue.trim() === '') { onSubmit(''); } else { onSubmit(inputValue); }
    }
  };

  const handleShapeSelect = (shape: ShapeType) => {
      onShapeChange(shape);
      setIsShapeMenuOpen(false);
  };

  const handleSpectrumMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const hue = x * 360;
    const lightness = (1 - y) * 100;
    onColorChange(`hsl(${hue}, 100%, ${lightness}%)`);
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
    if (!isDrawing) setIsPaletteOpen(false);
    onInteractionEnd();
  };

  const handleBgSpectrumMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const hue = x * 360;
    const lightness = (1 - y) * 100;
    onBgModeChange('color', `hsl(${hue}, 100%, ${lightness}%)`);
  };

  const handleBgSpectrumClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleBgSpectrumMove(e); 
    setIsBgPaletteOpen(false); 
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPendingImage(event.target.result as string);
          setUseOriginalImageColors(true); // Default
          setShowImageModal(true);
          onInteractionStart();
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBgImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          const promises = Array.from(files).map((file: File) => {
              return new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => resolve(e.target?.result as string);
                  reader.readAsDataURL(file);
              });
          });

          Promise.all(promises).then(images => {
              if (onBgImagesAdd) onBgImagesAdd(images);
              setIsThemeMenuOpen(false);
              onInteractionEnd();
          });
      }
      if (bgImageInputRef.current) bgImageInputRef.current.value = '';
  }

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const url = URL.createObjectURL(file);
        // Dosya ismini al
        onAudioChange('file', url, file.name);
        setShowAudioModal(false);
        onInteractionEnd();
    }
    if (audioInputRef.current) audioInputRef.current.value = '';
  }

  const confirmImageUpload = () => {
    if (pendingImage) {
      onImageUpload(pendingImage, useOriginalImageColors);
      setInputValue('');
    }
    setShowImageModal(false);
    setPendingImage(null);
    onInteractionEnd();
  };

  const handleCountChange = (val: number) => {
    const clamped = Math.max(22000, Math.min(50000, val));
    onParticleCountChange(clamped);
  };

  const cancelDrawing = () => onResetAll();
  const stopProp = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent | React.WheelEvent) => e.stopPropagation();

  const toggleThemeMenu = () => {
      setIsThemeMenuOpen(!isThemeMenuOpen);
      setIsShapeMenuOpen(false);
      setIsSettingsOpen(false); 
      setIsBgPaletteOpen(false);
  };

  const toggleShapeMenu = () => {
      setIsShapeMenuOpen(!isShapeMenuOpen);
      setIsThemeMenuOpen(false);
      setIsSettingsOpen(false);
      setIsBgPaletteOpen(false);
  }

  const hideTopClass = isUIHidden ? "-translate-y-[200%] opacity-0 pointer-events-none" : "translate-y-0 opacity-100";
  const hideBottomClass = isUIHidden ? "translate-y-[200%] opacity-0 pointer-events-none" : "translate-y-0 opacity-100";
  const hideLeftClass = isUIHidden ? "-translate-x-[200%] opacity-0 pointer-events-none" : "translate-x-0 opacity-100";

  // Müzik çalar görünürlük mantığı
  const showMusicPlayer = audioTitle && audioMode !== 'none';
  const hideMusicPlayer = isUIHidden && !musicShowInCleanMode;
  const musicPlayerClass = hideMusicPlayer ? "-translate-y-[200%] opacity-0 pointer-events-none" : "translate-y-0 opacity-100";

  // --- Background Deck Logic ---
  
  const handleDeckContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDeckExpanded(!isDeckExpanded);
  };

  const handleCardClick = (e: React.MouseEvent, img: string) => {
      e.stopPropagation();
      if (onBgImageSelect) onBgImageSelect(img);
      if (isDeckExpanded) setIsDeckExpanded(false);
  };

  const handleDeckScroll = (e: React.WheelEvent) => {
      e.stopPropagation();
      if (bgImages.length <= 1) return;
      
      const direction = e.deltaY > 0 ? 'next' : 'prev';
      
      setAnimDirection(direction);

      setTimeout(() => {
          setDeckIndex(prev => {
              let nextIdx = prev + (direction === 'next' ? 1 : -1);
              if (nextIdx < 0) nextIdx = bgImages.length - 1;
              if (nextIdx >= bgImages.length) nextIdx = 0;
              return nextIdx;
          });
          setAnimDirection(null);
      }, 400); 
  };

  // Helper to get relative index images
  const getDeckImage = (offset: number) => {
      if (bgImages.length === 0) return null;
      let idx = (deckIndex + offset) % bgImages.length;
      if (idx < 0) idx += bgImages.length;
      return bgImages[idx];
  };

  // Deck Visibility in Clean Mode Logic
  const shouldHideDeck = isUIHidden && deckHideInCleanMode;
  const deckClass = shouldHideDeck ? "translate-y-[200%] opacity-0 pointer-events-none" : "translate-y-0 opacity-100";

  // Expanded View Constants
  const EXPAND_COUNT = 6;
  const CARD_HEIGHT = 64; // h-16 = 64px
  const GAP = 2;

  const currentActiveImage = getDeckImage(0);

  // --- CROPPER LOGIC ---
  const openCropper = (e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      if(currentActiveImage) {
          setCropImage(currentActiveImage);
          setShowCropper(true);
          setDeckShowSettings(false);
      }
  }

  const handleCropMouseDown = (e: React.MouseEvent) => {
      setIsDraggingCrop(true);
      setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
      if (!isDraggingCrop) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      // Hassasiyet faktörü
      const sensitivity = 0.2 / cropZoom; 
      
      setCropPosition(prev => ({
          x: Math.max(0, Math.min(100, prev.x - dx * sensitivity)),
          y: Math.max(0, Math.min(100, prev.y - dy * sensitivity))
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCropMouseUp = () => {
      setIsDraggingCrop(false);
  };

  const handleCropWheel = (e: React.WheelEvent) => {
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setCropZoom(prev => Math.max(1, Math.min(3, prev + delta)));
  }

  const confirmCrop = () => {
      if(onBgPositionChange) {
          onBgPositionChange(`${cropPosition.x}% ${cropPosition.y}%`);
      }
      setShowCropper(false);
  };

  return (
    <>
      <style>{`
        /* Animasyonlar aynı kalıyor... */
        @keyframes electric-pulse { 0% { box-shadow: 0 0 5px #0ff; border-color: #0ff; } 50% { box-shadow: 0 0 20px #0ff, 0 0 10px #fff; border-color: #fff; } 100% { box-shadow: 0 0 5px #0ff; border-color: #0ff; } }
        @keyframes fire-burn { 0% { box-shadow: 0 0 5px #f00; border-color: #f00; background: rgba(255,0,0,0.1); } 50% { box-shadow: 0 -5px 20px #ff0, 0 0 10px #f00; border-color: #ff0; background: rgba(255,50,0,0.3); } 100% { box-shadow: 0 0 5px #f00; border-color: #f00; background: rgba(255,0,0,0.1); } }
        @keyframes water-flow { 0% { box-shadow: 0 0 5px #00f; border-color: #00f; } 50% { box-shadow: 0 5px 15px #0af; border-color: #0af; } 100% { box-shadow: 0 0 5px #00f; border-color: #00f; } }
        @keyframes mercury-blob { 0% { transform: scale(1); border-color: #aaa; background: rgba(200,200,200,0.2); } 50% { transform: scale(1.1); border-color: #fff; background: rgba(255,255,255,0.4); } 100% { transform: scale(1); border-color: #aaa; background: rgba(200,200,200,0.2); } }
        @keyframes disco-spin { 0% { border-color: #f00; box-shadow: 0 0 10px #f00; } 20% { border-color: #ff0; box-shadow: 0 0 10px #ff0; } 40% { border-color: #0f0; box-shadow: 0 0 10px #0f0; } 60% { border-color: #0ff; box-shadow: 0 0 10px #0ff; } 80% { border-color: #00f; box-shadow: 0 0 10px #00f; } 100% { border-color: #f0f; box-shadow: 0 0 10px #f0f; } }
        
        .deck-card {
            transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
            position: absolute;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 6px;
            background-size: cover;
            background-position: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.2);
            will-change: transform, bottom, opacity;
        }

        /* Lift and Drop Animations for Deck */
        @keyframes deck-lift-up-back {
            0% { transform: translateY(0) scale(1); z-index: 20; }
            50% { transform: translateY(-30px) scale(1.1); z-index: 25; }
            100% { transform: translateY(0) scale(0.9) translateY(5px); z-index: 5; opacity: 0.6; }
        }
        @keyframes deck-lift-down-front {
            0% { transform: translateY(0) scale(0.9); z-index: 5; opacity: 0.6; }
            50% { transform: translateY(30px) scale(1.1); z-index: 25; opacity: 1; }
            100% { transform: translateY(0) scale(1); z-index: 20; opacity: 1; }
        }

        .anim-lift-next { animation: deck-lift-up-back 0.4s forwards; }
        .anim-drop-prev { animation: deck-lift-down-front 0.4s forwards; }

        .theme-menu-item { opacity: 0; transform: translateX(20px); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events: none; }
        .theme-menu-open .theme-menu-item { opacity: 1; transform: translateX(0); pointer-events: auto; }
        .theme-menu-open .item-1 { transition-delay: 0.05s; }
        .theme-menu-open .item-2 { transition-delay: 0.1s; }
        .theme-menu-open .item-3 { transition-delay: 0.15s; }
        .theme-menu-open .item-4 { transition-delay: 0.2s; }
        .theme-menu-open .item-5 { transition-delay: 0.25s; }
        .theme-menu-open .item-6 { transition-delay: 0.3s; }
        
        .shape-menu-open .theme-menu-item { opacity: 1; transform: translateX(0); pointer-events: auto; }
        .shape-menu-open .item-1 { transition-delay: 0.05s; }
        .shape-menu-open .item-2 { transition-delay: 0.1s; }
        .shape-menu-open .item-3 { transition-delay: 0.15s; }
        .shape-menu-open .item-4 { transition-delay: 0.2s; }
        .shape-menu-open .item-5 { transition-delay: 0.25s; }

        /* VFX Popup Animation */
        @keyframes popup-open { 0% { transform: scale(0.8); opacity: 0; filter: blur(10px); } 100% { transform: scale(1); opacity: 1; filter: blur(0px); } }
        .animate-popup { animation: popup-open 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

      `}</style>
      
      {isAnyMenuOpen && ( <div className="fixed inset-0 z-40 bg-transparent" onPointerDown={closeAllMenus} /> )}

      {/* Preload Container */}
      <div className="hidden">
          {bgImages.map((src, i) => <img key={i} src={src} alt="preload" />)}
      </div>

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
      <input type="file" accept="audio/*" ref={audioInputRef} onChange={handleAudioSelect} className="hidden" />
      <input type="file" accept="image/*" multiple ref={bgImageInputRef} onChange={handleBgImagesSelect} className="hidden" />

      {/* ... (Show Music Player Code Omitted for Brevity - Unchanged) ... */}
      {showMusicPlayer && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-700 ease-in-out ${musicPlayerClass}`}>
             <div 
                className={`relative group rounded-full px-5 py-2 backdrop-blur-md shadow-lg border border-white/10 flex items-center justify-center overflow-visible max-w-[280px] transition-all duration-300 cursor-pointer ${isLightMode ? 'bg-black/10 text-black border-black/10' : 'bg-white/10 text-white'}`}
                onClick={onTogglePlay}
             >
                 <div className="absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-md"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-md"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    )}
                 </div>
                 
                 {!isPlaying && (
                     <div className="absolute left-2 z-10 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={isLightMode ? 'text-black/50' : 'text-white/50'}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                     </div>
                 )}

                 <div className={`w-full overflow-hidden ${!isPlaying ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
                    {audioTitle && audioTitle.length > 30 ? (
                        <div className="animate-marquee-loop">
                            <span className="whitespace-nowrap pr-[300px] text-[15px]" style={{ fontFamily: musicFont, fontWeight: musicBold ? 'bold' : 'normal', fontStyle: musicItalic ? 'italic' : 'normal' }}>{audioTitle}</span>
                            <span className="whitespace-nowrap pr-[300px] text-[15px]" style={{ fontFamily: musicFont, fontWeight: musicBold ? 'bold' : 'normal', fontStyle: musicItalic ? 'italic' : 'normal' }}>{audioTitle}</span>
                        </div>
                    ) : (
                        <span className="text-[15px] text-center block w-full whitespace-nowrap" style={{ fontFamily: musicFont, fontWeight: musicBold ? 'bold' : 'normal', fontStyle: musicItalic ? 'italic' : 'normal' }}>{audioTitle}</span>
                    )}
                 </div>

                 <button 
                    onClick={(e) => { e.stopPropagation(); setShowMusicSettings(!showMusicSettings); }}
                    className={`absolute -right-3 -top-3 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md z-30 ${isLightMode ? 'bg-white text-black border border-black/10' : 'bg-black text-white border border-white/20'}`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                 </button>

                 {showMusicSettings && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 bg-[#111]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-config-pop cursor-default z-40" onPointerDown={stopProp} onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-xs font-mono uppercase text-gray-500 mb-3 tracking-widest border-b border-white/10 pb-2 vfx-item delay-1 text-center">Müzik Ayarları</h4>
                        <div className="mb-3 vfx-item delay-2">
                            <label className="text-[10px] text-gray-400 block mb-1 font-medium">Yazı Tipi</label>
                            <select value={musicFont} onChange={(e) => setMusicFont(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-lg text-xs text-white p-2 outline-none cursor-pointer">
                                {FONTS.map(f => (<option key={f.name} value={f.value} className="bg-gray-900 text-white">{f.name}</option>))}
                            </select>
                        </div>
                        <div className="flex gap-2 mb-3 vfx-item delay-3">
                            <button onClick={() => setMusicBold(!musicBold)} className={`flex-1 py-1.5 rounded border text-xs font-bold transition-all ${musicBold ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>B</button>
                            <button onClick={() => setMusicItalic(!musicItalic)} className={`flex-1 py-1.5 rounded border text-xs italic transition-all ${musicItalic ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>I</button>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/10 pt-3 vfx-item delay-4">
                            <span className="text-[10px] text-gray-400 font-medium">Temiz Modda Göster</span>
                            <button onClick={() => setMusicShowInCleanMode(!musicShowInCleanMode)} className={`w-8 h-4 rounded-full relative transition-colors ${musicShowInCleanMode ? 'bg-blue-600' : 'bg-white/10'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${musicShowInCleanMode ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                 )}
             </div>
          </div>
      )}

      {/* ... (Modals Omitted for Brevity - Unchanged) ... */}
      {showImageModal && pendingImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onPointerDown={(e) => e.stopPropagation()}>
          <div className="bg-[#111] border border-white/20 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-white font-mono text-lg mb-4 text-center">Resim Önizleme</h3>
            <div className="w-full h-48 bg-black/50 rounded-lg mb-4 overflow-hidden flex items-center justify-center border border-white/10">
              <img src={pendingImage} alt="Preview" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setUseOriginalImageColors(true)} 
                  className={`flex-1 py-2 text-xs rounded border transition-all flex flex-col items-center justify-center gap-1 ${useOriginalImageColors ? 'bg-blue-600/30 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  <span className="font-bold">ORİJİNAL RENKLER</span>
                </button>
                <button 
                  onClick={() => setUseOriginalImageColors(false)} 
                  className={`flex-1 py-2 text-xs rounded border transition-all flex flex-col items-center justify-center gap-1 ${!useOriginalImageColors ? 'bg-blue-600/30 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  <span className="font-bold">TEMA RENGİ</span>
                </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowImageModal(false); setPendingImage(null); onInteractionEnd(); }} className="flex-1 py-3 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors font-medium">İptal</button>
              <button onClick={confirmImageUpload} className="flex-1 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors font-bold shadow-lg shadow-blue-900/50">Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* --- BACKGROUND DECK (CARD STACK) --- */}
      {bgImages.length > 0 && (
          <div 
            className={`absolute bottom-6 right-44 w-24 h-16 transition-all duration-500 ease-in-out ${deckClass} z-[55]`}
            onPointerDown={stopProp}
            onContextMenu={handleDeckContextMenu}
            onWheel={handleDeckScroll}
          >
              <div className="relative w-full h-full perspective-[500px]">
                  
                  {/* Deste Elemanları */}
                  {Array.from({ length: Math.min(bgImages.length, EXPAND_COUNT) }).map((_, i) => {
                      const imgIndex = (deckIndex + i) % bgImages.length;
                      const img = bgImages[imgIndex];
                      
                      // COLLAPSED STATE STYLES - PHYSICAL DECK LOOK
                      let collapsedBottom = 0;
                      let collapsedScale = 1;
                      let collapsedZ = 20 - i;
                      let collapsedOpacity = 1;
                      let collapsedTransform = `translateY(0) scale(1)`;
                      let animClass = "";

                      if (!isDeckExpanded) {
                          if (i === 0) { // Active (Middle)
                              collapsedZ = 20;
                              collapsedOpacity = 1;
                              if (animDirection === 'next') animClass = 'anim-lift-next';
                          } else if (i === 1) { // Next (Top peeking)
                              collapsedZ = 15;
                              collapsedScale = 0.9;
                              collapsedBottom = 5; 
                              collapsedTransform = `translateY(-5px) scale(0.9)`;
                              collapsedOpacity = 0.8;
                          } else if (i === bgImages.length - 1) { // Prev (Bottom peeking) - fake index logic for visual
                              // This loop logic iterates forward, so simulating "previous" visually needs a trick or just simple stacking
                              // We will stick to simple stacking: index 2+ are hidden under
                              collapsedOpacity = 0;
                          } else {
                              collapsedOpacity = 0;
                          }
                          
                          // Override specifically for the "Previous" visual if we are at index 0 and have history
                          // Since we rotate the array index, the last item in array is physically "before" the first if looped.
                          // But here we iterate 0..N. Let's just make index 2 peek from bottom to simulate "stack" depth?
                          if (i === 2) {
                              collapsedZ = 10;
                              collapsedScale = 0.85;
                              collapsedBottom = -3;
                              collapsedTransform = `translateY(3px) scale(0.85)`;
                              collapsedOpacity = 0.6;
                          }
                      }

                      // EXPANDED STATE STYLES
                      const expandedBottom = (CARD_HEIGHT + GAP) * i;
                      const expandedScale = 1;
                      const expandedOpacity = 1;
                      const expandedZ = 50 - i;
                      const expandedTransform = `translateY(0) scale(1)`;

                      // MERGED STYLES
                      const finalBottom = isDeckExpanded ? expandedBottom : collapsedBottom;
                      const finalTransform = isDeckExpanded ? expandedTransform : collapsedTransform;
                      const finalOpacity = isDeckExpanded ? expandedOpacity : collapsedOpacity;
                      const finalZ = isDeckExpanded ? expandedZ : collapsedZ;

                      return (
                          <div 
                            key={imgIndex} 
                            className={`deck-card cursor-pointer group hover:border-blue-400 ${!isDeckExpanded ? animClass : ''}`}
                            style={{ 
                                backgroundImage: `url(${img})`,
                                bottom: `${finalBottom}px`,
                                transform: finalTransform,
                                opacity: finalOpacity,
                                zIndex: finalZ,
                                transitionDelay: isDeckExpanded ? `${i * 0.05}s` : '0s'
                            }}
                            onClick={(e) => handleCardClick(e, img)}
                            onMouseEnter={() => {
                                if (isDeckExpanded && onBgImageSelect) onBgImageSelect(img);
                            }}
                          >
                             {/* Config Button (Only visible on top card when collapsed) */}
                             {i === 0 && !isDeckExpanded && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setDeckShowSettings(!deckShowSettings); }}
                                    className="absolute top-1 right-1 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                </button>
                             )}

                             {/* Remove Button (Visible in Expanded Mode) */}
                             {isDeckExpanded && (
                                 <button
                                    onClick={(e) => { e.stopPropagation(); if(onRemoveBgImage) onRemoveBgImage(img); }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-500 transition-colors z-50"
                                 >
                                     <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                 </button>
                             )}
                          </div>
                      );
                  })}
              </div>

              {/* Deck Settings Popup */}
              {deckShowSettings && !isDeckExpanded && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-32 bg-[#111]/95 backdrop-blur-xl border border-white/20 rounded-xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-config-pop origin-bottom z-[60]" onClick={stopProp}>
                      <h4 className="text-[10px] font-mono uppercase text-gray-500 mb-2 tracking-widest text-center border-b border-white/10 pb-1">Resim Boyutu</h4>
                      <div className="flex flex-col gap-1 mb-2">
                          <div className="flex gap-1">
                            <button onClick={(e) => { onBgImageStyleChange && onBgImageStyleChange('cover'); openCropper(e); }} className={`flex-1 text-[10px] py-1 px-1 rounded border transition-colors ${bgImageStyle === 'cover' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>Doldur</button>
                            {bgImageStyle === 'cover' && (
                                <button onClick={(e) => openCropper(e)} className="w-6 flex items-center justify-center rounded border border-white/10 bg-white/5 hover:bg-white/20 text-white" title="Konumla">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                </button>
                            )}
                          </div>
                          <button onClick={() => onBgImageStyleChange && onBgImageStyleChange('contain')} className={`text-[10px] py-1 px-2 rounded border transition-colors ${bgImageStyle === 'contain' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>Ortala</button>
                          <button onClick={() => onBgImageStyleChange && onBgImageStyleChange('fill')} className={`text-[10px] py-1 px-2 rounded border transition-colors ${bgImageStyle === 'fill' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>Uzat</button>
                      </div>
                      <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                          <span className="text-[9px] text-gray-400">Temiz Modda Gizle</span>
                          <button onClick={() => setDeckHideInCleanMode(!deckHideInCleanMode)} className={`w-6 h-3 rounded-full relative transition-colors ${deckHideInCleanMode ? 'bg-blue-600' : 'bg-white/10'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white transition-transform ${deckHideInCleanMode ? 'translate-x-3' : 'translate-x-0'}`} />
                          </button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* --- CROPPER MODAL (VFX POPUP) --- */}
      {showCropper && cropImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md" onPointerDown={(e) => e.stopPropagation()}>
              <div className="relative bg-[#111] border border-white/20 p-2 rounded-xl shadow-[0_0_50px_rgba(0,100,255,0.3)] animate-popup max-w-4xl w-full mx-4">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-20 font-mono tracking-wider">
                      KONUMLANDIRMA
                  </div>
                  
                  {/* Cropping Area */}
                  <div 
                    className="relative w-full aspect-video bg-black/50 overflow-hidden rounded-lg border border-white/10 cursor-move group"
                    ref={cropRef}
                    onMouseDown={handleCropMouseDown}
                    onMouseMove={handleCropMouseMove}
                    onMouseUp={handleCropMouseUp}
                    onMouseLeave={handleCropMouseUp}
                    onWheel={handleCropWheel}
                  >
                      {/* Grid Overlay */}
                      <div className="absolute inset-0 pointer-events-none z-10 opacity-30 border-2 border-blue-500/50">
                          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-blue-500/30"></div>
                          <div className="absolute right-1/3 top-0 bottom-0 w-px bg-blue-500/30"></div>
                          <div className="absolute top-1/3 left-0 right-0 h-px bg-blue-500/30"></div>
                          <div className="absolute bottom-1/3 left-0 right-0 h-px bg-blue-500/30"></div>
                      </div>
                      
                      {/* Image */}
                      <img 
                        src={cropImage} 
                        alt="Crop Target" 
                        className="absolute max-w-none w-full h-full object-cover transition-transform duration-75 ease-out"
                        style={{
                            objectPosition: `${cropPosition.x}% ${cropPosition.y}%`,
                            transform: `scale(${cropZoom})`
                        }}
                      />
                      
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] text-white/70 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                          Sürükle: Konum | Tekerlek: Yakınlaş
                      </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 px-2">
                      <div className="text-[10px] text-gray-500 font-mono">
                          POS: {Math.round(cropPosition.x)}%,{Math.round(cropPosition.y)}% | ZOOM: {cropZoom.toFixed(1)}x
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => setShowCropper(false)} className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-colors">İptal</button>
                          <button onClick={confirmCrop} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 text-xs font-bold shadow-lg shadow-blue-900/50 transition-all hover:scale-105">Onayla</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Ses Yükleme Onay Modalı (Düzenlenmiş) */}
      {showAudioModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onPointerDown={(e) => e.stopPropagation()}>
           <div className="bg-[#111] border border-white/20 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
             <div className="flex flex-col items-center gap-4 mb-6">
               <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/50">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
               </div>
               <h3 className="text-white font-mono text-lg text-center">Ses Kaynağı Seçin</h3>
               <p className="text-gray-400 text-xs text-center">Partiküller seçtiğiniz müziğin ritmine göre dans edecek.</p>
             </div>
             {/* Butonların yerleri değiştirildi: Mikrofon ve Dosya Seç üstte */}
             <div className="flex gap-3">
                <button onClick={() => { onAudioChange('mic', null, 'Mikrofon Girişi'); setShowAudioModal(false); onInteractionEnd(); }} className="flex-1 py-3 rounded-lg bg-white/10 text-white/90 hover:bg-white/20 hover:text-white transition-colors font-bold text-sm border border-white/10">Mikrofon</button>
                <button onClick={() => audioInputRef.current?.click()} className="flex-1 py-3 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors font-bold text-sm shadow-lg shadow-green-900/50">Dosya Seç</button>
             </div>
             {/* İptal butonu alta alındı */}
             <div className="mt-3">
                <button onClick={() => { setShowAudioModal(false); onInteractionEnd(); }} className="w-full py-3 rounded-lg border border-white/10 text-white/50 hover:bg-white/5 hover:text-white transition-colors text-sm">İptal</button>
             </div>
           </div>
        </div>
      )}

      {/* --- MENU VE KONTROLLER (MEVCUT KOD) --- */}

      <div className={`absolute left-6 z-50 flex flex-col gap-4 transition-all duration-500 ease-in-out ${isWidgetMinimized ? 'top-32' : 'top-[230px]'} ${hideLeftClass}`} onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd} onPointerDown={stopProp}>
          <button onClick={() => onPresetChange(activePreset === 'electric' ? 'none' : 'electric')} className={`preset-btn preset-electric w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center group relative ${activePreset === 'electric' ? 'active' : ''} ${isLightMode ? 'border-black/20 bg-black/5 hover:bg-black/10' : 'border-white/20 bg-black/50 hover:bg-white/10'}`} title="Elektrik Efekti"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></button>
          <button onClick={() => onPresetChange(activePreset === 'fire' ? 'none' : 'fire')} className={`preset-btn preset-fire w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center group relative ${activePreset === 'fire' ? 'active' : ''} ${isLightMode ? 'border-black/20 bg-black/5 hover:bg-black/10' : 'border-white/20 bg-black/50 hover:bg-white/10'}`} title="Ateş Efekti"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3 .5.7 1 1.3 2 1.5z"></path></svg></button>
          <button onClick={() => onPresetChange(activePreset === 'water' ? 'none' : 'water')} className={`preset-btn preset-water w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center group relative ${activePreset === 'water' ? 'active' : ''} ${isLightMode ? 'border-black/20 bg-black/5 hover:bg-black/10' : 'border-white/20 bg-black/50 hover:bg-white/10'}`} title="Su Efekti"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg></button>
          <button onClick={() => onPresetChange(activePreset === 'mercury' ? 'none' : 'mercury')} className={`preset-btn preset-mercury w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center group relative ${activePreset === 'mercury' ? 'active' : ''} ${isLightMode ? 'border-black/20 bg-black/5 hover:bg-black/10' : 'border-white/20 bg-black/50 hover:bg-white/10'}`} title="Civa Efekti"><div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-600 border border-white/50"></div></button>
          <button onClick={() => onPresetChange(activePreset === 'disco' ? 'none' : 'disco')} className={`preset-btn preset-disco w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center group relative ${activePreset === 'disco' ? 'active' : ''} ${isLightMode ? 'border-black/20 bg-black/5 hover:bg-black/10' : 'border-white/20 bg-black/50 hover:bg-white/10'}`} title="Disco Modu"><div className="w-4 h-4 rounded-full bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] border border-white/50 animate-spin" style={{ animationDuration: '3s' }}></div></button>
      </div>

      {!isDrawing && (
        <div className={`absolute bottom-6 left-6 z-10 pointer-events-none select-none text-xs font-mono space-y-2 transition-transform duration-500 ${hideBottomClass} ${isLightMode ? 'text-black/60' : 'text-white/50'}`}>
            <div className="flex items-center gap-2"><div className={`w-4 h-4 border rounded grid place-items-center text-[10px] ${isLightMode ? 'border-black/30' : 'border-white/30'}`}>L</div><span>Sol Tık: Dağıt</span></div>
            <div className="flex items-center gap-2"><div className={`w-4 h-4 border rounded grid place-items-center text-[10px] ${isLightMode ? 'border-black/30' : 'border-white/30'}`}>R</div><span>Sağ Tık: Döndür</span></div>
            <div className="flex items-center gap-2"><div className={`w-4 h-4 border rounded grid place-items-center text-[10px] ${isLightMode ? 'border-black/30' : 'border-white/30'}`}>M</div><span>Tekerlek: Yakınlaş</span></div>
        </div>
      )}
      {isDrawing && (
         <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none bg-black/50 px-6 py-2 rounded-full border border-white/20 backdrop-blur-md flex flex-col items-center transition-transform duration-500 ${hideTopClass}`}>
            <p className="text-white text-sm font-mono animate-pulse">3D Tuval: Sol Tık Çiz - Sağ Tık Kamera</p>
            <p className="text-white/50 text-[10px] mt-1">Tuvali döndürmek için sağ menüdeki okları kullanın</p>
         </div>
      )}
      
      {isBgPaletteOpen && !isUIHidden && (
          <div className="absolute bottom-24 right-4 z-50 origin-bottom-right oval-picker-container" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd} onPointerDown={stopProp}>
              <div className={`backdrop-blur-xl border border-white/20 p-2 rounded-3xl shadow-2xl relative w-64 ${isLightMode ? 'bg-black/90' : 'bg-[#111]/90'}`}>
                  <div className="flex justify-between items-center px-3 py-1 border-b border-white/10 mb-2">
                      <span className="text-white/70 text-[10px] font-mono tracking-widest uppercase">BG Color VFX</span>
                      <button onClick={() => setIsBgPaletteOpen(false)} className="w-5 h-5 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 text-white/50 hover:text-white transition-colors"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"></path></svg></button>
                  </div>
                  <div className="w-full h-24 rounded-2xl cursor-crosshair relative overflow-hidden shadow-inner border border-white/10 group mx-auto" onMouseMove={handleBgSpectrumMove} onClick={handleBgSpectrumClick} style={{ background: 'white' }}>
                     <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }} />
                     <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%)' }} />
                     <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border-2 border-white/20 rounded-2xl"></div>
                  </div>
                  <div className="mt-2 flex gap-3 items-center justify-center pb-1">
                       <div className="w-5 h-5 rounded-full border border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: customBgColor }}></div>
                       <span className="text-[10px] font-mono text-white/50">{customBgColor.toUpperCase()}</span>
                  </div>
              </div>
          </div>
      )}

      {/* Sahne Gizle/Göster Butonu - SAĞ ALT */}
      <button 
        onClick={onToggleScene} 
        className={`absolute bottom-6 right-20 z-[60] w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-md shadow-lg group ${isLightMode ? 'border-black/20 text-black bg-black/5 hover:bg-black/10' : 'border-white/20 text-white bg-white/10 hover:bg-white/20'}`} 
        title={isSceneVisible ? "Nesneyi Gizle" : "Nesneyi Göster"}
      >
          {isSceneVisible ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
          )}
      </button>

      <button onClick={onToggleUI} className={`absolute bottom-6 right-6 z-[60] w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-md shadow-lg ${isLightMode ? 'border-black/20 text-black bg-black/5 hover:bg-black/10' : 'border-white/20 text-white bg-white/10 hover:bg-white/20'}`} title={isUIHidden ? "Arayüzü Göster" : "Temiz Mod"}>
          {isUIHidden ? (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>)}
      </button>

      <div className={`absolute top-6 right-6 z-50 flex flex-col items-end gap-3 transition-transform duration-500 ${hideTopClass}`} onPointerDown={stopProp}>
        <div className="flex gap-2">
            <button onClick={toggleShapeMenu} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border ${isLightMode ? `border-black/20 text-black ${isShapeMenuOpen ? 'bg-black/20 scale-110 shadow-[0_0_15px_rgba(0,0,0,0.3)]' : 'bg-black/5 hover:bg-black/10'}` : `border-white/20 text-white ${isShapeMenuOpen ? 'bg-white/20 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/5 hover:bg-white/10'}`}`} title="Şekil Değiştir"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></button>
            <button onClick={toggleThemeMenu} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border ${isLightMode ? `border-black/20 text-black ${isThemeMenuOpen ? 'bg-black/20 scale-110 shadow-[0_0_15px_rgba(0,0,0,0.3)]' : 'bg-black/5 hover:bg-black/10'}` : `border-white/20 text-white ${isThemeMenuOpen ? 'bg-white/20 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/5 hover:bg-white/10'}`}`} title="Tema ve Arka Plan"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path><path d="M16 16.5l-3 3"></path><path d="M11 11.5l-3 3"></path></svg></button>
            <button onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsThemeMenuOpen(false); setIsShapeMenuOpen(false); setIsBgPaletteOpen(false); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border ${isLightMode ? `border-black/20 text-black ${isSettingsOpen ? 'bg-black/20 rotate-90' : 'bg-black/5 hover:bg-black/10'}` : `border-white/20 text-white ${isSettingsOpen ? 'bg-white/20 rotate-90' : 'bg-white/5 hover:bg-white/10'}`}`} title="Konfigürasyon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
        </div>

        {/* ... (Theme and Shape menus omitted for brevity) ... */}
        <div className={`absolute top-12 right-24 flex flex-col gap-2 items-end ${isShapeMenuOpen ? 'shape-menu-open pointer-events-auto' : 'pointer-events-none'}`}>
             <button onClick={() => handleShapeSelect('sphere')} className={`theme-menu-item item-1 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-black/60 backdrop-blur text-white hover:scale-110 ${currentShape === 'sphere' ? 'ring-2 ring-blue-400 bg-blue-500/30' : ''}`} title="Küre"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg></button>
             <button onClick={() => handleShapeSelect('cube')} className={`theme-menu-item item-2 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-black/60 backdrop-blur text-white hover:scale-110 ${currentShape === 'cube' ? 'ring-2 ring-blue-400 bg-blue-500/30' : ''}`} title="Küp"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg></button>
             <button onClick={() => handleShapeSelect('prism')} className={`theme-menu-item item-3 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-black/60 backdrop-blur text-white hover:scale-110 ${currentShape === 'prism' ? 'ring-2 ring-blue-400 bg-blue-500/30' : ''}`} title="Üçgen Prizma"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg></button>
             <button onClick={() => handleShapeSelect('star')} className={`theme-menu-item item-4 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-black/60 backdrop-blur text-white hover:scale-110 ${currentShape === 'star' ? 'ring-2 ring-blue-400 bg-blue-500/30' : ''}`} title="Yıldız"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></button>
             <button onClick={() => handleShapeSelect('spiky')} className={`theme-menu-item item-5 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-black/60 backdrop-blur text-white hover:scale-110 ${currentShape === 'spiky' ? 'ring-2 ring-blue-400 bg-blue-500/30' : ''}`} title="Dikenli Küre"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg></button>
        </div>

        <div className={`absolute top-12 right-12 flex flex-col gap-2 items-end ${isThemeMenuOpen ? 'theme-menu-open pointer-events-auto' : 'pointer-events-none'}`}>
             <button onClick={() => { onBgModeChange('dark'); setIsThemeMenuOpen(false); }} className={`theme-menu-item item-1 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-black/80 text-white hover:scale-110 ${bgMode === 'dark' ? 'ring-2 ring-white' : ''}`} title="Karanlık Mod"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></button>
             <button onClick={() => { onBgModeChange('light'); setIsThemeMenuOpen(false); }} className={`theme-menu-item item-2 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-white text-black hover:scale-110 ${bgMode === 'light' ? 'ring-2 ring-yellow-400' : ''}`} title="Aydınlık Mod"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg></button>
             <button onClick={() => { bgImageInputRef.current?.click(); }} className={`theme-menu-item item-3 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-gray-800 text-white hover:scale-110 ${bgMode === 'image' ? 'ring-2 ring-blue-400' : ''}`} title="Arka Plan Resmi"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></button>
             <button onClick={() => { setIsBgPaletteOpen(!isBgPaletteOpen); setIsThemeMenuOpen(false); }} className={`theme-menu-item item-4 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-gradient-to-tr from-pink-500 to-purple-500 text-white hover:scale-110 ${bgMode === 'color' ? 'ring-2 ring-pink-300' : ''}`} title="Arka Plan Rengi"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 22.5A9.5 9.5 0 0 0 22 12c0-4.9-4.5-9-10-9S2 7.1 2 12c0 2.25 1 5.38 2.5 7.5"></path></svg></button>
             <button onClick={() => { onBgModeChange('gradient'); setIsThemeMenuOpen(false); }} className={`theme-menu-item item-5 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-[linear-gradient(45deg,red,blue)] text-white hover:scale-110 ${bgMode === 'gradient' ? 'ring-2 ring-purple-400' : ''}`} title="Disko Modu"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></button>
             <button onClick={() => { onBgModeChange('auto'); setIsThemeMenuOpen(false); }} className={`theme-menu-item item-6 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-gray-900 text-white hover:scale-110 ${bgMode === 'auto' ? 'ring-2 ring-green-400' : ''}`} title="Otomatik Döngü"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
        </div>

        {isSettingsOpen && (
          <div className="absolute top-12 right-0 w-64 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl origin-top-right menu-animate" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}>
            <h4 className="text-white/80 text-xs font-mono uppercase tracking-widest mb-4 border-b border-white/10 pb-2 vfx-item delay-1">Konfigürasyon</h4>
            {isDrawing && (
                <div className="mb-5 border-b border-white/10 pb-4 space-y-4 vfx-item delay-2">
                    <div>
                        <div className="flex justify-between text-xs text-yellow-400 mb-1 font-bold"><span>Fırça Kalınlığı</span><span>{brushSize}px</span></div>
                        <input type="range" min="1" max="100" value={brushSize} onPointerDown={onInteractionStart} onPointerUp={onInteractionEnd} onChange={(e) => onBrushSizeChange(parseInt(e.target.value))} className="w-full h-1.5 bg-yellow-500/30 rounded-lg appearance-none cursor-pointer accent-yellow-400 hover:accent-yellow-200"/>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-blue-400 mb-2 font-bold"><span>Tuval Yönü (90° Çevir)</span></div>
                        <div className="flex gap-2">
                             <button onClick={onRotateX} className="flex-1 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-[10px] text-white">X Ekseni</button>
                             <button onClick={onRotateY} className="flex-1 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-[10px] text-white">Y Ekseni</button>
                             <button onClick={onRotateZ} className="flex-1 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-[10px] text-white">Z Ekseni</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="mb-5 vfx-item delay-3"><div className="flex justify-between text-xs text-gray-400 mb-1"><span>İmleç Gücü</span><span>{repulsionStrength}%</span></div><input type="range" min="0" max="100" value={repulsionStrength} onPointerDown={onInteractionStart} onPointerUp={onInteractionEnd} onChange={(e) => onRepulsionChange(parseInt(e.target.value))} className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-300"/></div>
            <div className="mb-5 vfx-item delay-4"><div className="flex justify-between text-xs text-gray-400 mb-1"><span>İmleç Çapı</span><span>{repulsionRadius}%</span></div><input type="range" min="0" max="100" value={repulsionRadius} onPointerDown={onInteractionStart} onPointerUp={onInteractionEnd} onChange={(e) => onRadiusChange(parseInt(e.target.value))} className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-300"/></div>
            <div className="mb-5 vfx-item delay-5">
              <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Partikül Sayısı</span></div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleCountChange(particleCount - 2000)} onPointerDown={stopProp} onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd} className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10">-</button>
                <input type="number" min="22000" max="50000" step="2000" value={particleCount} onChange={(e) => handleCountChange(parseInt(e.target.value) || 22000)} className="flex-1 h-8 bg-black/50 border border-white/10 rounded text-center text-white text-xs font-mono focus:outline-none focus:border-white/40"/>
                <button type="button" onClick={() => handleCountChange(particleCount + 2000)} onPointerDown={stopProp} onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd} className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10">+</button>
              </div>
              <div className="text-[10px] text-gray-600 mt-1 text-center">Max: 50,000</div>
            </div>
            <div className="mb-5 vfx-item delay-6"><div className="flex justify-between text-xs text-gray-400 mb-1"><span>Model Sıkılığı</span><span>{modelDensity}%</span></div><input type="range" min="0" max="100" value={modelDensity} onPointerDown={onInteractionStart} onPointerUp={onInteractionEnd} onChange={(e) => onModelDensityChange(parseInt(e.target.value))} className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-300"/></div>
            {hasImage && !isDrawing && (
                <div className="mb-5 border-t border-white/10 pt-4 vfx-item delay-7">
                    <div className="flex justify-between text-xs text-blue-300 mb-1"><span>Derinlik Etkisi</span><span>{Math.round(depthIntensity * 10)}%</span></div>
                    <input type="range" min="0" max="10" step="0.1" value={depthIntensity} onPointerDown={onInteractionStart} onPointerUp={onInteractionEnd} onChange={(e) => onDepthChange(parseFloat(e.target.value))} className="w-full h-1.5 bg-blue-500/30 rounded-lg appearance-none cursor-pointer accent-blue-400 hover:accent-blue-200"/>
                </div>
            )}
            <div className="mb-2 vfx-item delay-7"><div className="flex justify-between text-xs text-gray-400 mb-1"><span>Partikül Boyutu</span><span>{particleSize}</span></div><input type="range" min="1" max="100" value={particleSize} onPointerDown={onInteractionStart} onPointerUp={onInteractionEnd} onChange={(e) => onParticleSizeChange(parseInt(e.target.value))} className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-300"/></div>
          </div>
        )}
      </div>

      <div className="absolute bottom-10 left-0 w-full flex justify-center items-center pointer-events-none z-50 px-4">
        <div className={`pointer-events-auto w-full max-w-lg relative group flex gap-2 items-center transition-transform duration-500 ${hideBottomClass}`} onPointerDown={stopProp}>
          {isPaletteOpen && (
            <div className="absolute bottom-full right-0 translate-x-2 mb-2 bg-black/80 backdrop-blur-xl border border-white/20 p-2 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200 origin-bottom-right" onMouseEnter={() => onInteractionStart()} onMouseLeave={() => { if(!isDrawing) onColorChange(savedColor); onInteractionEnd(); }}>
              <div className="text-white/60 text-[10px] mb-1 font-mono text-center">Renk Seçici</div>
              <div className="w-48 h-32 rounded-lg cursor-crosshair relative overflow-hidden shadow-inner border border-white/10" onMouseMove={handleSpectrumMove} onClick={handleSpectrumClick} style={{ background: 'white' }}>
                 <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }} />
                 <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%)' }} />
              </div>
            </div>
          )}
          
          {!isDrawing && (<button onClick={() => { setShowAudioModal(true); onInteractionStart(); }} className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 border ${audioMode !== 'none' ? 'bg-green-500/20 text-green-300 border-green-500/50' : isLightMode ? 'bg-black/5 hover:bg-black/10 border-black/20 hover:border-black/50 text-black/80' : 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/50 text-white'}`} title="Müzik/Ses Ekle" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></button>)}
          {!isDrawing && (<button onClick={() => fileInputRef.current?.click()} className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 border ${isLightMode ? 'bg-black/5 hover:bg-black/10 border-black/20 hover:border-black/50 text-black/80' : 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/50 text-white'}`} title="Resim Yükle" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></button>)}
          <button onClick={isDrawing ? cancelDrawing : onDrawingStart} className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 border ${isDrawing ? 'bg-red-500/20 text-red-200 border-red-500/50 hover:bg-red-500/40' : isLightMode ? 'bg-black/5 hover:bg-black/10 border-black/20 hover:border-black/50 text-black/80' : 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/50 text-white'}`} title={isDrawing ? "Çizimi İptal Et" : "Çizim Yap"} onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}>{isDrawing ? (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>)}</button>
          {!isDrawing ? (<input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} onFocus={() => onInteractionStart()} onBlur={() => onInteractionEnd()} placeholder="Metin yazın (Türkçe destekli)..." className={`flex-1 backdrop-blur-md border rounded-full px-6 py-4 outline-none transition-all duration-300 shadow-lg text-center font-light tracking-wide text-lg ${isLightMode ? 'bg-black/5 border-black/10 text-black placeholder-gray-500 focus:bg-black/10 focus:border-black/30' : 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 focus:border-white/50'}`} />) : (<div className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 text-center text-white/50 font-light tracking-wide text-lg select-none">3D Tuval Aktif</div>)}
          {isDrawing && (<button onClick={onDrawingConfirm} className="w-16 flex-shrink-0 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 hover:border-green-400 text-green-100 rounded-full px-2 py-4 transition-all duration-300 shadow-lg text-center font-light tracking-wide flex items-center justify-center gap-2 group" title="Çizimi Dönüştür"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><polyline points="20 6 9 17 4 12"></polyline></svg></button>)}
          <div className="flex items-center gap-2">
            {hasImage && !isOriginalColors && !isDrawing && (<button onClick={onResetColors} className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-gradient-to-tr from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 transition-all duration-300 border border-white/20 hover:border-white/50 text-white/80 hover:text-white animate-in fade-in zoom-in" title="Orijinal Renklere Dön" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg></button>)}
            <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 border-2 z-20 ${isLightMode ? 'bg-black/5 hover:bg-black/20 border-black/20 hover:border-black shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]' : 'bg-white/5 hover:bg-white/20 border-white/20 hover:border-white shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'}`} title="Renk Paletini Aç" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}><div className={`w-6 h-6 rounded-full shadow-sm ${isLightMode ? 'border border-black/20' : 'border border-white/50'}`} style={{ backgroundColor: currentColor }} /></button>
             <button onClick={isDrawing ? onClearCanvas : onResetAll} className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 border ${isDrawing ? 'bg-orange-500/10 hover:bg-orange-500/30 hover:border-orange-400 border-white/20 text-white/70 hover:text-white' : isLightMode ? 'bg-red-500/10 hover:bg-red-500/30 hover:border-red-400 border-black/20 text-black/70 hover:text-black' : 'bg-red-500/10 hover:bg-red-500/30 hover:border-red-400 border-white/20 text-white/70 hover:text-white'}`} title="Tuvali Temizle" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}>{isDrawing ? (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg>)}</button>
          </div>
        </div>
        {!isDrawing && (<div className={`absolute -bottom-6 text-center text-[10px] font-mono opacity-50 ${isLightMode ? 'text-black' : 'text-gray-500'}`}>Küre moduna dönmek için boş Enter</div>)}
      </div>

    </>
  );
};