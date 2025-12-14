import React, { useState, useRef, useEffect } from 'react';
import { PresetType, AudioMode, BackgroundMode, BgImageStyle, ShapeType, SlideshowSettings, SlideshowTransition, SlideshowOrder } from '../types';

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
  onAudioChange: (mode: AudioMode, url: string | null, title?: string, lang?: string) => void;
  audioMode: AudioMode;
  audioTitle?: string | null;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  volume?: number;
  onVolumeChange?: (vol: number) => void;

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
  onBgPositionChange?: (pos: string, zoom: number) => void; 
  onBgTransformChange?: (croppedDataUrl: string) => void; 
  onResetDeck?: (deleteImages: boolean, resetSize: boolean) => void;
  
  // Slideshow Props
  slideshowSettings?: SlideshowSettings;
  onSlideshowSettingsChange?: (settings: React.SetStateAction<SlideshowSettings>) => void;

  // Rotation
  isAutoRotating?: boolean;
  onToggleAutoRotation?: () => void;

  // NEW: Lyric Particles Control
  useLyricParticles?: boolean;
  onToggleLyricParticles?: () => void;
  hasLyrics?: boolean;
  useLyricEcho?: boolean; // New prop
  onToggleLyricEcho?: () => void; // New prop
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
  volume = 0.5,
  onVolumeChange,
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
  onBgPositionChange,
  onBgTransformChange,
  onResetDeck,
  slideshowSettings,
  onSlideshowSettingsChange,
  isAutoRotating = true,
  onToggleAutoRotation,
  useLyricParticles = false,
  onToggleLyricParticles,
  hasLyrics = false,
  useLyricEcho = false,
  onToggleLyricEcho
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
  const [selectedLanguage, setSelectedLanguage] = useState('turkish');

  // Müzik Çalar Ayarları
  const [showMusicSettings, setShowMusicSettings] = useState(false);
  const [musicFont, setMusicFont] = useState(FONTS[0].value);
  const [musicBold, setMusicBold] = useState(false);
  const [musicItalic, setMusicItalic] = useState(false);
  const [musicShowInCleanMode, setMusicShowInCleanMode] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  // Background Deck State
  const [deckIndex, setDeckIndex] = useState(0);
  const [deckShowSettings, setDeckShowSettings] = useState(false);
  const [deckHideInCleanMode, setDeckHideInCleanMode] = useState(false);
  const [animDirection, setAnimDirection] = useState<'next' | 'prev' | null>(null);
  
  // Slideshow UI State
  const [showSlideshowPanel, setShowSlideshowPanel] = useState(false);
  const [showTransitionGrid, setShowTransitionGrid] = useState(false);

  // Expanded Deck Mode (Right Click)
  const [isDeckExpanded, setIsDeckExpanded] = useState(false);

  // Reset Menu State
  const [showResetMenu, setShowResetMenu] = useState(false);
  const [resetDeleteAll, setResetDeleteAll] = useState(false);
  const [resetResetSize, setResetResetSize] = useState(true);

  // Cropper Modal State
  const [showCropper, setShowCropper] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  
  // Cropper Logic States
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 }); // PX offset
  const [cropScale, setCropScale] = useState(1);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startOffset, setStartOffset] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const isLightMode = bgMode === 'light';
  const isAnyMenuOpen = isSettingsOpen || isThemeMenuOpen || isShapeMenuOpen || isBgPaletteOpen || isPaletteOpen || showMusicSettings || deckShowSettings || showResetMenu;

  const closeAllMenus = () => {
    setIsSettingsOpen(false);
    setIsThemeMenuOpen(false);
    setIsShapeMenuOpen(false);
    setIsBgPaletteOpen(false);
    setIsPaletteOpen(false);
    setShowMusicSettings(false);
    setDeckShowSettings(false);
    setShowResetMenu(false);
    setShowSlideshowPanel(false); // Close slideshow panel on general close
    
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
        onAudioChange('file', url, file.name, selectedLanguage);
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
    const clamped = Math.max(20000, Math.min(60000, val));
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
      
      // 1. Resmi Arka Plana Ayarla
      if (onBgImageSelect) onBgImageSelect(img);
      
      // 2. Deck İndeksini Tıklanan Resme Göre Güncelle (Thubmnail Sync)
      const clickedIndex = bgImages.indexOf(img);
      if (clickedIndex !== -1) {
          setDeckIndex(clickedIndex);
      }

      // 3. Menüyü Kapat
      if (isDeckExpanded) setIsDeckExpanded(false);
  };

  const handleDeckScroll = (e: React.WheelEvent) => {
      e.stopPropagation();
      if (bgImages.length <= 1) return;
      
      const direction = e.deltaY > 0 ? 'next' : 'prev';
      setAnimDirection(direction);

      if (direction === 'next') {
          // Next için: Önce animasyon (atılma), sonra index güncelleme
          setTimeout(() => {
              setDeckIndex(prev => {
                  let nextIdx = prev + 1;
                  if (nextIdx >= bgImages.length) nextIdx = 0;
                  return nextIdx;
              });
              setAnimDirection(null);
          }, 400); 
      } else {
          // Prev için: Önce index güncelleme (arkadan geleni başa alma), sonra animasyon bitişi
          setDeckIndex(prev => {
              let nextIdx = prev - 1;
              if (nextIdx < 0) nextIdx = bgImages.length - 1;
              return nextIdx;
          });
          setTimeout(() => {
              setAnimDirection(null);
          }, 500);
      }
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

  // --- CROPPER LOGIC (CANVAS CAPTURE "Secret Gallery") ---
  const openCropper = (e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      if(currentActiveImage) {
          setCropImage(currentActiveImage);
          setShowCropper(true);
          setDeckShowSettings(false);
          // Reset cropper state to neutral
          setCropOffset({x: 0, y: 0});
          setCropScale(1);
      }
  }

  const handleCropMouseDown = (e: React.MouseEvent) => {
      setIsDraggingCrop(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setStartOffset({ ...cropOffset });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
      if (!isDraggingCrop) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      // Update local offset (pixels)
      setCropOffset({
          x: startOffset.x + dx,
          y: startOffset.y + dy
      });
  };

  const handleCropMouseUp = () => {
      setIsDraggingCrop(false);
  };

  const handleCropWheel = (e: React.WheelEvent) => {
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setCropScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
  }

  const confirmCrop = () => {
      if(onBgTransformChange && cropContainerRef.current && cropImageRef.current) {
          const img = cropImageRef.current;
          
          // Mavi Çerçeve Boyutları (Ekran boyutuna göre 16:9 oranlı hesaplama ile aynı olmalı)
          // Aşağıdaki hesaplama CSS'teki w-[80vw] mantığına benzer
          const frameWidth = Math.min(window.innerWidth * 0.8, 1280);
          const frameHeight = frameWidth * (9/16);
          
          const canvas = document.createElement('canvas');
          canvas.width = frameWidth;
          canvas.height = frameHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
              // Canvas'ı temizle
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // Resmi çiz
              // Merkez noktasına translate et
              ctx.translate(canvas.width / 2, canvas.height / 2);
              
              // Zoom ve Pan uygula
              ctx.translate(cropOffset.x, cropOffset.y);
              ctx.scale(cropScale, cropScale);
              
              // Resmin yüklendiğinden emin olun
              if(img.complete) {
                  const drawW = img.naturalWidth;
                  const drawH = img.naturalHeight;
                  // Natural boyutlarda çizip scale'i uyguluyoruz.
                  ctx.drawImage(img, -drawW / 2, -drawH / 2);
              }
              
              // Veriyi al
              const dataUrl = canvas.toDataURL('image/png', 1.0);
              onBgTransformChange(dataUrl); // Gizli galeriye kaydet
          }
      }
      setShowCropper(false);
  };

  // --- RESET MENU LOGIC ---
  const openResetMenu = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowResetMenu(true);
      setDeckShowSettings(false); // Close other menu
  };

  const handleResetConfirm = () => {
      if (onResetDeck) {
          onResetDeck(resetDeleteAll, resetResetSize);
      }
      setShowResetMenu(false);
  };

  // --- SLIDESHOW HELPERS ---
  const toggleSlideshow = () => {
      if (onSlideshowSettingsChange && slideshowSettings) {
          onSlideshowSettingsChange(prev => ({ ...prev, active: !prev.active }));
      }
  };

  const updateSlideshow = (updates: Partial<SlideshowSettings>) => {
      if (onSlideshowSettingsChange) {
          onSlideshowSettingsChange(prev => ({ ...prev, ...updates }));
      }
  };

  const TRANSITION_ICONS: Record<SlideshowTransition, React.ReactNode> = {
      'random': <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l5 5M4 4l5 5"/></svg>,
      'slide-left': <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
      'slide-right': <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
      'slide-up': <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>,
      'slide-down': <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>,
      'particles': <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="4" cy="4" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="20" cy="4" r="2"/><circle cx="4" cy="20" r="2"/><circle cx="12" cy="20" r="2"/><circle cx="20" cy="20" r="2"/></svg>,
      'transform': <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20"/></svg>,
      'fade': <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="4 4"/></svg>,
      'blur': <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  };

  const TRANSITION_NAMES: Record<SlideshowTransition, string> = {
      'random': 'Rastgele',
      'slide-left': 'Sola Kay',
      'slide-right': 'Sağa Kay',
      'slide-up': 'Yukarı',
      'slide-down': 'Aşağı',
      'particles': 'Partikül',
      'transform': 'Dönüşüm',
      'fade': 'Solma',
      'blur': 'Bulanık',
  };

  return (
    <>
      <style>{`
        /* Animasyonlar */
        @keyframes electric-pulse { 0% { box-shadow: 0 0 5px #0ff; border-color: #0ff; } 50% { box-shadow: 0 0 20px #0ff, 0 0 10px #fff; border-color: #fff; } 100% { box-shadow: 0 0 5px #0ff; border-color: #0ff; } }
        @keyframes fire-burn { 0% { box-shadow: 0 0 5px #f00; border-color: #f00; background: rgba(255,0,0,0.1); } 50% { box-shadow: 0 -5px 20px #ff0, 0 0 10px #f00; border-color: #ff0; background: rgba(255,50,0,0.3); } 100% { box-shadow: 0 0 5px #f00; border-color: #f00; background: rgba(255,0,0,0.1); } }
        @keyframes water-flow { 0% { box-shadow: 0 0 5px #00f; border-color: #00f; } 50% { box-shadow: 0 5px 15px #0af; border-color: #0af; } 100% { box-shadow: 0 0 5px #00f; border-color: #00f; } }
        @keyframes mercury-blob { 0% { transform: scale(1); border-color: #aaa; background: rgba(200,200,200,0.2); } 50% { transform: scale(1.1); border-color: #fff; background: rgba(255,255,255,0.4); } 100% { transform: scale(1); border-color: #aaa; background: rgba(200,200,200,0.2); } }
        @keyframes disco-spin { 0% { border-color: #f00; box-shadow: 0 0 10px #f00; } 20% { border-color: #ff0; box-shadow: 0 0 10px #ff0; } 40% { border-color: #0f0; box-shadow: 0 0 10px #0f0; } 60% { border-color: #0ff; box-shadow: 0 0 10px #0ff; } 80% { border-color: #00f; box-shadow: 0 0 10px #00f; } 100% { border-color: #f0f; box-shadow: 0 0 10px #f0f; } }

        /* Preset Button Active States */
        .preset-btn.active.preset-electric { animation: electric-pulse 1.5s infinite !important; background: rgba(0, 255, 255, 0.1) !important; }
        .preset-btn.active.preset-fire { animation: fire-burn 1.5s infinite !important; background: rgba(255, 69, 0, 0.1) !important; }
        .preset-btn.active.preset-water { animation: water-flow 3s infinite !important; background: rgba(0, 100, 255, 0.1) !important; }
        .preset-btn.active.preset-mercury { animation: mercury-blob 4s infinite !important; }
        .preset-btn.active.preset-disco { animation: disco-spin 2s linear infinite !important; }

        /* Icon Internal Animations */
        @keyframes icon-wiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
        @keyframes icon-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes icon-spin-hover { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes icon-pulse-hover { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
        
        button:hover .icon-animate-wiggle { animation: icon-wiggle 0.3s ease-in-out; }
        button:hover .icon-animate-bounce { animation: icon-bounce 0.5s ease-in-out infinite; }
        button:hover .icon-animate-spin { animation: icon-spin-hover 1s linear infinite; }
        button:hover .icon-animate-pulse { animation: icon-pulse-hover 0.8s ease-in-out infinite; }

        /* Marquee */
        @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee-loop { display: flex; animation: marquee-scroll 10s linear infinite; width: max-content; }

        /* Deck Throw Animations */
        @keyframes deck-throw-next {
            0% { transform: rotate(0deg) translateY(0); z-index: 20; }
            50% { transform: rotate(-30deg) translateX(-60px) translateY(-20px); z-index: 20; opacity: 0.8; }
            51% { z-index: 0; }
            100% { transform: rotate(0deg) translate(0,0) scale(0.9); z-index: 0; opacity: 0.5; }
        }
        @keyframes deck-extract-from-back {
            0% { transform: translateY(-20px) scale(0.85); z-index: 0; opacity: 0.5; }
            40% { transform: translateY(-120px) translateX(-40px) rotate(-15deg) scale(0.9); z-index: 60; opacity: 1; }
            100% { transform: translateY(0) translateX(0) rotate(0) scale(1); z-index: 60; opacity: 1; }
        }

        .anim-throw-next { animation: deck-throw-next 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; transform-origin: bottom left; }
        .anim-extract-from-back { animation: deck-extract-from-back 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; transform-origin: bottom left; }

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
            transform-origin: bottom left;
        }

        /* Menu CSS */
        .theme-menu-item { opacity: 0 !important; transform: translateX(20px); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events: none !important; }
        .theme-menu-open .theme-menu-item, .shape-menu-open .theme-menu-item { opacity: 1 !important; transform: translateX(0); pointer-events: auto !important; }
        
        .item-1 { transition-delay: 0.05s; }
        .item-2 { transition-delay: 0.1s; }
        .item-3 { transition-delay: 0.15s; }
        .item-4 { transition-delay: 0.2s; }
        .item-5 { transition-delay: 0.25s; }
        .item-6 { transition-delay: 0.3s; }

        /* Popup */
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

      {/* Music Player */}
      {showMusicPlayer && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-700 ease-in-out ${musicPlayerClass}`}>
             <div 
                className={`relative group rounded-full px-5 py-2 backdrop-blur-md shadow-lg border border-white/10 flex items-center justify-center overflow-visible max-w-[280px] transition-all duration-300 ${isLightMode ? 'bg-black/10 text-black border-black/10' : 'bg-white/10 text-white'}`}
                onMouseLeave={() => setShowVolumeControl(false)}
             >
                 {/* Play/Pause & Volume Trigger */}
                 <div className="absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-3">
                        <button onClick={onTogglePlay} className="text-white drop-shadow-md hover:scale-110 transition-transform">
                             {isPlaying ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            )}
                        </button>
                        {/* Volume Icon */}
                        <div 
                            className="relative flex items-center"
                            onMouseEnter={() => setShowVolumeControl(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 hover:text-white cursor-pointer"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                            
                            {/* Volume Slider Popup */}
                            {showVolumeControl && onVolumeChange && (
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-24 h-8 bg-[#111] rounded-full flex items-center px-3 border border-white/20 shadow-xl ml-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.01" 
                                        value={volume} 
                                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                 </div>
                 
                 {!isPlaying && (
                     <div className="absolute left-2 z-10 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={isLightMode ? 'text-black/50' : 'text-white/50'}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                     </div>
                 )}

                 {/* Marquee Text Container */}
                 <div className={`w-full overflow-hidden ${!isPlaying ? 'opacity-50' : 'opacity-100'} transition-opacity mask-image-linear-gradient`}>
                    {audioTitle && audioTitle.length > 25 ? (
                        <div className="w-[200px] overflow-hidden">
                            <div className="animate-marquee-loop">
                                <span className="whitespace-nowrap px-4 text-[15px]" style={{ fontFamily: musicFont, fontWeight: musicBold ? 'bold' : 'normal', fontStyle: musicItalic ? 'italic' : 'normal' }}>{audioTitle}</span>
                                <span className="whitespace-nowrap px-4 text-[15px]" style={{ fontFamily: musicFont, fontWeight: musicBold ? 'bold' : 'normal', fontStyle: musicItalic ? 'italic' : 'normal' }}>{audioTitle}</span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-[15px] text-center block w-full whitespace-nowrap" style={{ fontFamily: musicFont, fontWeight: musicBold ? 'bold' : 'normal', fontStyle: musicItalic ? 'italic' : 'normal' }}>{audioTitle}</span>
                    )}
                 </div>

                 <button 
                    onClick={(e) => { e.stopPropagation(); setShowMusicSettings(!showMusicSettings); }}
                    className={`absolute -right-3 -top-3 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md z-30 ${isLightMode ? 'bg-white text-black border border-black/10' : 'bg-black text-white border border-white/20'}`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
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
                        {/* New Lyric Toggle */}
                        {hasLyrics && (
                            <div className="border-t border-white/10 pt-3 mt-1 vfx-item delay-5 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-400 font-medium">Partikül Sözler (Beta)</span>
                                    <button onClick={onToggleLyricParticles} className={`w-8 h-4 rounded-full relative transition-colors ${useLyricParticles ? 'bg-purple-600' : 'bg-white/10'}`}>
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useLyricParticles ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                
                                {useLyricParticles && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 font-medium pl-2 border-l-2 border-purple-500/50">Eko (Ritim)</span>
                                        <button onClick={onToggleLyricEcho} className={`w-8 h-4 rounded-full relative transition-colors ${useLyricEcho ? 'bg-orange-600' : 'bg-white/10'}`}>
                                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useLyricEcho ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                 )}
             </div>
          </div>
      )}

      {/* Image Preview Modal */}
      {showImageModal && pendingImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onPointerDown={(e) => e.stopPropagation()}>
          <div className="bg-[#111] border border-white/20 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-white font-mono text-lg mb-4 text-center">Resim Önizleme</h3>
            <div className="w-full h-48 bg-black/50 rounded-lg mb-4 overflow-hidden flex items-center justify-center border border-white/10">
              <img src={pendingImage} alt="Preview" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="flex gap-2 mb-6">
                <button onClick={() => setUseOriginalImageColors(true)} className={`flex-1 py-2 text-xs rounded border transition-all flex flex-col items-center justify-center gap-1 ${useOriginalImageColors ? 'bg-blue-600/30 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}><span className="font-bold">ORİJİNAL RENKLER</span></button>
                <button onClick={() => setUseOriginalImageColors(false)} className={`flex-1 py-2 text-xs rounded border transition-all flex flex-col items-center justify-center gap-1 ${!useOriginalImageColors ? 'bg-blue-600/30 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}><span className="font-bold">TEMA RENGİ</span></button>
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
                      
                      let collapsedBottom = 0;
                      let collapsedScale = 1;
                      let collapsedZ = 20 - i;
                      let collapsedOpacity = 1;
                      let collapsedTransform = `translateY(0) translateX(0) rotate(0) scale(1)`;
                      let animClass = "";

                      if (!isDeckExpanded) {
                          if (i === 0) { // Active
                              collapsedZ = 20;
                              collapsedOpacity = 1;
                              if (animDirection === 'next') animClass = 'anim-throw-next';
                              if (animDirection === 'prev') {
                                  animClass = 'anim-extract-from-back';
                                  collapsedZ = 60; 
                              }
                          } else if (i === 1) { // Next
                              collapsedZ = 15;
                              collapsedScale = 0.95;
                              collapsedBottom = 4;
                              collapsedTransform = `translateY(-4px) translateX(2px) rotate(2deg) scale(0.95)`;
                              collapsedOpacity = 0.9;
                              if (animDirection === 'prev') {
                                  collapsedTransform = `translateY(0) translateX(0) rotate(0) scale(1)`;
                                  collapsedBottom = 0;
                                  collapsedOpacity = 1;
                                  collapsedZ = 19; 
                              }
                          } else {
                              collapsedOpacity = 0;
                          }
                          
                          if (i === 2) {
                              collapsedZ = 10;
                              collapsedScale = 0.9;
                              collapsedBottom = -2;
                              collapsedTransform = `translateY(2px) translateX(4px) rotate(4deg) scale(0.9)`;
                              collapsedOpacity = 0.7;
                          }
                      }

                      const expandedBottom = (CARD_HEIGHT + GAP) * i;
                      const expandedScale = 1;
                      const expandedOpacity = 1;
                      const expandedZ = 50 - i;
                      const expandedTransform = `translateY(0) scale(1)`;

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
                             {/* Config Button */}
                             {i === 0 && !isDeckExpanded && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setDeckShowSettings(!deckShowSettings); setShowResetMenu(false); }}
                                    className="absolute top-1 right-1 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                </button>
                             )}
                             
                             {/* Reset (Trash) Button */}
                             {i === 0 && !isDeckExpanded && (
                                <button 
                                    onClick={openResetMenu}
                                    className="absolute top-1 left-1 w-4 h-4 bg-red-600/80 rounded-full flex items-center justify-center text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                             )}

                             {/* Remove Button */}
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
                      
                      {/* Slayt Modu Paneli (Yukarı Doğru Uzayan Kısım) */}
                      {showSlideshowPanel && slideshowSettings && (
                          <div className="absolute bottom-full left-0 w-full mb-2 bg-[#111]/95 backdrop-blur-xl border border-white/20 rounded-xl p-2 shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200 z-[70] origin-bottom">
                              <h5 className="text-[9px] font-mono text-gray-400 text-center uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Slayt Ayarları</h5>
                              
                              {/* 1. Süre Girişi */}
                              <div className="flex items-center gap-1 mb-2 bg-white/5 rounded p-1 border border-white/10">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                  <input 
                                    type="number" 
                                    min="3" 
                                    max="300" 
                                    value={slideshowSettings.duration} 
                                    onChange={(e) => updateSlideshow({ duration: Math.max(3, Math.min(300, parseInt(e.target.value) || 3)) })} 
                                    className="w-full bg-transparent text-[10px] text-white text-center outline-none"
                                  />
                                  <span className="text-[9px] text-gray-500">sn</span>
                              </div>

                              {/* 2. Sıra Seçimi */}
                              <div className="flex gap-1 mb-2">
                                  <button onClick={() => updateSlideshow({ order: 'random' })} className={`flex-1 py-1 rounded flex justify-center items-center hover:scale-105 transition-all ${slideshowSettings.order === 'random' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`} title="Rastgele">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={slideshowSettings.order === 'random' ? 'animate-spin-slow' : ''}><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l5 5M4 4l5 5"/></svg>
                                  </button>
                                  <button onClick={() => updateSlideshow({ order: 'sequential' })} className={`flex-1 py-1 rounded flex justify-center items-center hover:scale-105 transition-all ${slideshowSettings.order === 'sequential' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`} title="Sırayla">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                                  </button>
                              </div>

                              {/* 3. Geçiş Efekti */}
                              <div className="relative">
                                  <button onClick={() => setShowTransitionGrid(!showTransitionGrid)} className="w-full py-1.5 rounded bg-white/5 border border-white/10 text-[9px] text-gray-300 hover:bg-white/10 flex items-center justify-between px-2">
                                      <div className="flex items-center gap-1">
                                          {TRANSITION_ICONS[slideshowSettings.transition]}
                                          <span className="truncate max-w-[60px]">{TRANSITION_NAMES[slideshowSettings.transition]}</span>
                                      </div>
                                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showTransitionGrid ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                                  </button>
                                  
                                  {/* Grid Menu */}
                                  {showTransitionGrid && (
                                      <div className="absolute bottom-full left-0 w-full mb-1 bg-[#111] border border-white/20 rounded-lg p-1 grid grid-cols-3 gap-1 shadow-2xl z-[80]">
                                          {(Object.keys(TRANSITION_ICONS) as SlideshowTransition[]).map((t) => (
                                              <button 
                                                key={t}
                                                onClick={() => { updateSlideshow({ transition: t }); setShowTransitionGrid(false); }}
                                                className={`w-full aspect-square flex items-center justify-center rounded hover:scale-110 transition-all ${slideshowSettings.transition === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                                title={TRANSITION_NAMES[t]}
                                              >
                                                  <div className="hover:animate-pulse">
                                                    {TRANSITION_ICONS[t]}
                                                  </div>
                                              </button>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      <h4 className="text-[10px] font-mono uppercase text-gray-500 mb-2 tracking-widest text-center border-b border-white/10 pb-1">Resim Boyutu</h4>
                      <div className="flex flex-col gap-1 mb-2">
                          <div className="flex gap-1">
                            <button onClick={(e) => { onBgImageStyleChange && onBgImageStyleChange('cover'); openCropper(e); }} className={`flex-1 text-[10px] py-1 px-1 rounded border transition-colors ${bgImageStyle === 'cover' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>Doldur</button>
                            {bgImageStyle === 'cover' && (
                                <button onClick={(e) => openCropper(e)} className="w-6 flex items-center justify-center rounded border border-white/10 bg-white/5 hover:bg-white/20 text-white" title="Konumla">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                </button>
                            )}
                          </div>
                          <button onClick={() => onBgImageStyleChange && onBgImageStyleChange('contain')} className={`text-[10px] py-1 px-2 rounded border transition-colors ${bgImageStyle === 'contain' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>Ortala</button>
                          <button onClick={() => onBgImageStyleChange && onBgImageStyleChange('fill')} className={`text-[10px] py-1 px-2 rounded border transition-colors ${bgImageStyle === 'fill' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>Uzat</button>
                          
                          {/* Slayt Modu Butonu */}
                          <button onClick={() => { toggleSlideshow(); setShowSlideshowPanel(!showSlideshowPanel); }} className={`text-[10px] py-1 px-2 rounded border transition-colors flex items-center justify-center gap-1 ${slideshowSettings?.active ? 'bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(0,255,0,0.3)] animate-pulse' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              <span>{slideshowSettings?.active ? 'SLAYT AÇIK' : 'SLAYT'}</span>
                          </button>
                      </div>
                      
                      <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                          <span className="text-[9px] text-gray-400">Temiz Modda Gizle</span>
                          <button onClick={() => setDeckHideInCleanMode(!deckHideInCleanMode)} className={`w-6 h-3 rounded-full relative transition-colors ${deckHideInCleanMode ? 'bg-blue-600' : 'bg-white/10'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white transition-transform ${deckHideInCleanMode ? 'translate-x-3' : 'translate-x-0'}`} />
                          </button>
                      </div>
                  </div>
              )}

              {/* Reset Menu Popup */}
              {showResetMenu && !isDeckExpanded && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-40 bg-[#111]/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-config-pop origin-bottom z-[60]" onClick={stopProp}>
                      <h4 className="text-[10px] font-mono uppercase text-red-400 mb-2 tracking-widest text-center border-b border-white/10 pb-1">Sıfırlama</h4>
                      <div className="flex flex-col gap-2 mb-3">
                          <label className="flex items-center gap-2 cursor-pointer group">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${resetDeleteAll ? 'bg-red-600 border-red-500' : 'border-white/30 group-hover:border-white/50'}`}>
                                  {resetDeleteAll && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                              </div>
                              <input type="checkbox" className="hidden" checked={resetDeleteAll} onChange={() => setResetDeleteAll(!resetDeleteAll)} />
                              <span className="text-[10px] text-gray-300">Tümünü Sil</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${resetResetSize ? 'bg-blue-600 border-blue-500' : 'border-white/30 group-hover:border-white/50'}`}>
                                  {resetResetSize && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                              </div>
                              <input type="checkbox" className="hidden" checked={resetResetSize} onChange={() => setResetResetSize(!resetResetSize)} />
                              <span className="text-[10px] text-gray-300">Boyutu Sıfırla</span>
                          </label>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => setShowResetMenu(false)} className="flex-1 py-1 rounded bg-white/10 text-[10px] text-gray-300 hover:bg-white/20">İptal</button>
                          <button onClick={handleResetConfirm} className="flex-1 py-1 rounded bg-red-600 text-[10px] text-white hover:bg-red-500 font-bold">Onayla</button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* --- CROPPER MODAL (FULL SCREEN 16:9 RECT) --- */}
      {showCropper && cropImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black" onPointerDown={(e) => e.stopPropagation()}>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-20 font-mono tracking-wider">
                 KONUMLANDIRMA MODU
              </div>
              
              <div 
                  className="relative w-full h-full overflow-hidden flex items-center justify-center"
                  ref={cropContainerRef}
                  onMouseDown={handleCropMouseDown}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onMouseLeave={handleCropMouseUp}
                  onWheel={handleCropWheel}
                  style={{ cursor: isDraggingCrop ? 'grabbing' : 'grab' }}
              >
                  <img 
                    ref={cropImageRef}
                    src={cropImage} 
                    alt="Target"
                    className="absolute max-w-none transition-transform duration-75"
                    style={{
                        transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropScale})`,
                        transformOrigin: 'center center'
                    }}
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>
                   <div 
                        className="relative w-[80vw] max-w-[1280px] aspect-video border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] pointer-events-none z-10"
                   >
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-blue-500/30"></div>
                        <div className="absolute right-1/3 top-0 bottom-0 w-px bg-blue-500/30"></div>
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-blue-500/30"></div>
                        <div className="absolute bottom-1/3 left-0 right-0 h-px bg-blue-500/30"></div>
                        <div className="absolute bottom-2 left-2 text-blue-400 text-[10px] font-mono opacity-70">16:9 REFERENCE FRAME</div>
                   </div>
              </div>
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 z-50">
                   <div className="bg-black/80 backdrop-blur border border-white/10 px-4 py-2 rounded-full text-white/50 text-xs font-mono">
                      POS: {Math.round(cropOffset.x)},{Math.round(cropOffset.y)} | ZOOM: {cropScale.toFixed(2)}x
                   </div>
                   <button onClick={() => setShowCropper(false)} className="px-6 py-2 rounded-full bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-colors border border-white/10">İPTAL</button>
                   <button onClick={confirmCrop} className="px-8 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 text-xs font-bold shadow-lg shadow-blue-900/50 transition-all hover:scale-105">UYGULA</button>
              </div>
          </div>
      )}

      {/* Ses Yükleme Onay Modalı */}
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

             {/* Dil Seçimi */}
             <div className="mb-6">
                 <label className="text-[10px] text-gray-400 block mb-2 font-mono uppercase tracking-wider text-center">Analiz Dili</label>
                 <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                     <button onClick={() => setSelectedLanguage('auto')} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${selectedLanguage === 'auto' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Otomatik</button>
                     <button onClick={() => setSelectedLanguage('turkish')} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${selectedLanguage === 'turkish' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Türkçe</button>
                     <button onClick={() => setSelectedLanguage('english')} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${selectedLanguage === 'english' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>English</button>
                 </div>
             </div>

             <div className="flex gap-3">
                <button onClick={() => { onAudioChange('mic', null, 'Mikrofon Girişi', selectedLanguage); setShowAudioModal(false); onInteractionEnd(); }} className="flex-1 py-3 rounded-lg bg-white/10 text-white/90 hover:bg-white/20 hover:text-white transition-colors font-bold text-sm border border-white/10">Mikrofon</button>
                <button onClick={() => audioInputRef.current?.click()} className="flex-1 py-3 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors font-bold text-sm shadow-lg shadow-green-900/50">Dosya Seç</button>
             </div>
             <div className="mt-3">
                <button onClick={() => { setShowAudioModal(false); onInteractionEnd(); }} className="w-full py-3 rounded-lg border border-white/10 text-white/50 hover:bg-white/5 hover:text-white transition-colors text-sm">İptal</button>
             </div>
           </div>
        </div>
      )}

      {/* --- SOL MENÜ --- */}
      <div className={`absolute left-6 z-50 flex flex-col gap-4 transition-all duration-500 ease-in-out ${isWidgetMinimized ? 'top-32' : 'top-[230px]'} ${hideLeftClass}`} onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd} onPointerDown={stopProp}>
          <button onClick={() => onPresetChange(activePreset === 'electric' ? 'none' : 'electric')} className={`preset-btn preset-electric w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center relative ${activePreset === 'electric' ? 'active' : ''} ${isLightMode ? 'border-black/20 bg-black/5 hover:bg-black/10' : 'border-white/20 bg-black/50 hover:bg-white/10'}`} title="Elektrik Efekti"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400 icon-animate-wiggle"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></button>
          <button onClick={() => onPresetChange(activePreset === 'fire' ? 'none' : 'fire')} className={`preset-btn preset-fire w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center relative ${activePreset === 'fire' ? 'active' : ''} ${isLightMode ? 'border-black/20 bg-black/5 hover:bg-black/10' : 'border-white/20 bg-black/50 hover:bg-white/10'}`} title="Ateş Efekti"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500 icon-animate-bounce"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3 .5.7 1 1.3 2 1.5z"></path></svg></button>
          <button onClick={() => onPresetChange(activePreset === 'water' ? 'none' : 'water')} className={`preset-btn preset-water w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center relative ${activePreset === 'water' ? 'active' : ''} ${isLightMode ? 'border-black/20 bg-black/5 hover:bg-black/10' : 'border-white/20 bg-black/50 hover:bg-white/10'}`} title="Su Efekti"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 icon-animate-wiggle"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg></button>
          <button onClick={() => onPresetChange(activePreset === 'mercury' ? 'none' : 'mercury')} className={`preset-btn preset-mercury w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center relative ${activePreset === 'mercury' ? 'active' : ''} ${isLightMode ? 'border-black/20 bg-black/5 hover:bg-black/10' : 'border-white/20 bg-black/50 hover:bg-white/10'}`} title="Civa Efekti"><div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-600 border border-white/50 icon-animate-pulse"></div></button>
          <button onClick={() => onPresetChange(activePreset === 'disco' ? 'none' : 'disco')} className={`preset-btn preset-disco w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center relative ${activePreset === 'disco' ? 'active' : ''} ${isLightMode ? 'border-black/20 bg-black/5 hover:bg-black/10' : 'border-white/20 bg-black/50 hover:bg-white/10'}`} title="Disco Modu"><div className="w-4 h-4 rounded-full bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] border border-white/50 animate-spin icon-animate-spin" style={{ animationDuration: '3s' }}></div></button>
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
          <div className="absolute bottom-24 right-4 z-[100] origin-bottom-right oval-picker-container" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd} onPointerDown={stopProp}>
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

      {/* Orbit Butonu - SAĞ ALT */}
      <button 
        onClick={onToggleAutoRotation} 
        className={`absolute bottom-6 right-32 z-[60] w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-md shadow-lg group ${hideBottomClass} ${isLightMode ? 'border-black/20 text-black bg-black/5 hover:bg-black/10' : 'border-white/20 text-white bg-white/10 hover:bg-white/20'}`} 
        title={isAutoRotating ? "Dönmeyi Durdur" : "Rastgele Döndür"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`group-hover:animate-spin ${!isAutoRotating ? 'opacity-50' : ''}`}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
      </button>

      {/* Sahne Gizle/Göster Butonu - SAĞ ALT */}
      <button 
        onClick={onToggleScene} 
        className={`absolute bottom-6 right-20 z-[60] w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-md shadow-lg group ${hideBottomClass} ${isLightMode ? 'border-black/20 text-black bg-black/5 hover:bg-black/10' : 'border-white/20 text-white bg-white/10 hover:bg-white/20'}`} 
        title={isSceneVisible ? "Nesneyi Gizle" : "Nesneyi Göster"}
      >
          {isSceneVisible ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animate-pulse"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
          )}
      </button>

      <button onClick={onToggleUI} className={`absolute bottom-6 right-6 z-[60] w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-md shadow-lg group ${isLightMode ? 'border-black/20 text-black bg-black/5 hover:bg-black/10' : 'border-white/20 text-white bg-white/10 hover:bg-white/20'}`} title={isUIHidden ? "Arayüzü Göster" : "Temiz Mod"}>
          {isUIHidden ? (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animate-spin"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animate-bounce"><line x1="5" y1="12" x2="19" y2="12"></line></svg>)}
      </button>

      {/* Top Right Controls (Theme, Shape, Config) */}
      <div className={`absolute top-6 right-6 z-50 flex flex-col items-end gap-3 transition-transform duration-500 ${hideTopClass}`} onPointerDown={stopProp}>
        <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); toggleShapeMenu(); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border group ${isLightMode ? `border-black/20 text-black ${isShapeMenuOpen ? 'bg-black/20 scale-110 shadow-[0_0_15px_rgba(0,0,0,0.3)]' : 'bg-black/5 hover:bg-black/10'}` : `border-white/20 text-white ${isShapeMenuOpen ? 'bg-white/20 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/5 hover:bg-white/10'}`}`} title="Şekil Değiştir"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animate-wiggle"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></button>
            <button onClick={(e) => { e.stopPropagation(); toggleThemeMenu(); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border group ${isLightMode ? `border-black/20 text-black ${isThemeMenuOpen ? 'bg-black/20 scale-110 shadow-[0_0_15px_rgba(0,0,0,0.3)]' : 'bg-black/5 hover:bg-black/10'}` : `border-white/20 text-white ${isThemeMenuOpen ? 'bg-white/20 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/5 hover:bg-white/10'}`}`} title="Tema ve Arka Plan"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animate-spin"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path><path d="M16 16.5l-3 3"></path><path d="M11 11.5l-3 3"></path></svg></button>
            <button onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); setIsThemeMenuOpen(false); setIsShapeMenuOpen(false); setIsBgPaletteOpen(false); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border group ${isLightMode ? `border-black/20 text-black ${isSettingsOpen ? 'bg-black/20 rotate-90' : 'bg-black/5 hover:bg-black/10'}` : `border-white/20 text-white ${isSettingsOpen ? 'bg-white/20 rotate-90' : 'bg-white/5 hover:bg-white/10'}`}`} title="Konfigürasyon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animate-spin"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
        </div>

        <div className={`absolute top-12 right-24 z-[60] flex flex-col gap-2 items-end ${isShapeMenuOpen ? 'shape-menu-open pointer-events-auto' : 'pointer-events-none'}`}>
             <button onClick={() => handleShapeSelect('sphere')} className={`theme-menu-item item-1 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-black/60 backdrop-blur text-white hover:scale-110 ${currentShape === 'sphere' ? 'ring-2 ring-blue-400 bg-blue-500/30' : ''}`} title="Küre"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg></button>
             <button onClick={() => handleShapeSelect('cube')} className={`theme-menu-item item-2 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-black/60 backdrop-blur text-white hover:scale-110 ${currentShape === 'cube' ? 'ring-2 ring-blue-400 bg-blue-500/30' : ''}`} title="Küp"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg></button>
             <button onClick={() => handleShapeSelect('prism')} className={`theme-menu-item item-3 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-black/60 backdrop-blur text-white hover:scale-110 ${currentShape === 'prism' ? 'ring-2 ring-blue-400 bg-blue-500/30' : ''}`} title="Üçgen Prizma"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg></button>
             <button onClick={() => handleShapeSelect('star')} className={`theme-menu-item item-4 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-black/60 backdrop-blur text-white hover:scale-110 ${currentShape === 'star' ? 'ring-2 ring-blue-400 bg-blue-500/30' : ''}`} title="Yıldız"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></button>
             <button onClick={() => handleShapeSelect('spiky')} className={`theme-menu-item item-5 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-black/60 backdrop-blur text-white hover:scale-110 ${currentShape === 'spiky' ? 'ring-2 ring-blue-400 bg-blue-500/30' : ''}`} title="Dikenli Küre"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg></button>
        </div>

        <div className={`absolute top-12 right-12 z-[60] flex flex-col gap-2 items-end ${isThemeMenuOpen ? 'theme-menu-open pointer-events-auto' : 'pointer-events-none'}`}>
             <button onClick={() => { onBgModeChange('dark'); setIsThemeMenuOpen(false); }} className={`theme-menu-item item-1 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-black/80 text-white hover:scale-110 ${bgMode === 'dark' ? 'ring-2 ring-white' : ''}`} title="Karanlık Mod"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></button>
             <button onClick={() => { onBgModeChange('light'); setIsThemeMenuOpen(false); }} className={`theme-menu-item item-2 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-white text-black hover:scale-110 ${bgMode === 'light' ? 'ring-2 ring-yellow-400' : ''}`} title="Aydınlık Mod"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg></button>
             <button onClick={() => { bgImageInputRef.current?.click(); }} className={`theme-menu-item item-3 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-gray-800 text-white hover:scale-110 ${bgMode === 'image' ? 'ring-2 ring-blue-400' : ''}`} title="Arka Plan Resmi"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></button>
             <button onClick={() => { setIsBgPaletteOpen(!isBgPaletteOpen); setIsThemeMenuOpen(false); }} className={`theme-menu-item item-4 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-gradient-to-tr from-pink-500 to-purple-500 text-white hover:scale-110 ${bgMode === 'color' ? 'ring-2 ring-pink-300' : ''}`} title="Arka Plan Rengi"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 22.5A9.5 9.5 0 0 0 22 12c0-4.9-4.5-9-10-9S2 7.1 2 12c0 2.25 1 5.38 2.5 7.5"></path></svg></button>
             <button onClick={() => { onBgModeChange('gradient'); setIsThemeMenuOpen(false); }} className={`theme-menu-item item-5 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-[linear-gradient(45deg,red,blue)] text-white hover:scale-110 ${bgMode === 'gradient' ? 'ring-2 ring-purple-400' : ''}`} title="Disko Modu"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></button>
             <button onClick={() => { onBgModeChange('auto'); setIsThemeMenuOpen(false); }} className={`theme-menu-item item-6 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all bg-gray-900 text-white hover:scale-110 ${bgMode === 'auto' ? 'ring-2 ring-green-400' : ''}`} title="Otomatik Döngü"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
        </div>
      </div>

      {isSettingsOpen && (
        <div className={`absolute top-20 right-6 z-[60] w-80 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-config-pop origin-top-right cursor-default transition-colors duration-300 ${isLightMode ? 'bg-white/80 text-black border-black/10' : 'bg-[#0a0a0a]/90 text-white border-white/10'}`} onPointerDown={stopProp}>
            {/* Header */}
            <div className={`flex justify-between items-center border-b pb-3 mb-4 ${isLightMode ? 'border-black/10' : 'border-white/10'}`}>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isLightMode ? 'bg-black' : 'bg-white'} animate-pulse`}></div>
                    <h4 className="text-sm font-bold tracking-wide font-mono uppercase">Sistem Ayarları</h4>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className={`p-1 rounded-full transition-colors ${isLightMode ? 'hover:bg-black/10' : 'hover:bg-white/10'}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                </button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Group 1: Fizik & Etkileşim */}
                <div>
                    <h5 className={`text-[10px] font-bold uppercase mb-3 opacity-60 flex items-center gap-2 ${isLightMode ? 'text-black' : 'text-white'}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
                        Fizik Motoru
                    </h5>
                    
                    <div className="space-y-4">
                        {/* Repulsion Strength */}
                        <div className="group">
                            <div className="flex justify-between mb-1.5">
                                <span className="text-xs font-medium opacity-80">İtme Kuvveti</span>
                                <span className="text-xs font-mono font-bold text-blue-500">%{repulsionStrength}</span>
                            </div>
                            <div className="relative h-1.5 w-full rounded-full bg-gray-500/20 overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${repulsionStrength}%` }}></div>
                                <input type="range" min="0" max="100" value={repulsionStrength} onChange={(e) => onRepulsionChange(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>
                        </div>

                        {/* Repulsion Radius */}
                        <div className="group">
                            <div className="flex justify-between mb-1.5">
                                <span className="text-xs font-medium opacity-80">Etki Alanı</span>
                                <span className="text-xs font-mono font-bold text-purple-500">%{repulsionRadius}</span>
                            </div>
                            <div className="relative h-1.5 w-full rounded-full bg-gray-500/20 overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all duration-300" style={{ width: `${repulsionRadius}%` }}></div>
                                <input type="range" min="10" max="100" value={repulsionRadius} onChange={(e) => onRadiusChange(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Group 2: Model Yapısı */}
                <div>
                    <h5 className={`text-[10px] font-bold uppercase mb-3 opacity-60 flex items-center gap-2 ${isLightMode ? 'text-black' : 'text-white'}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                        Partikül Yapısı
                    </h5>

                    <div className="space-y-4">
                        {/* Count */}
                        <div className="group">
                            <div className="flex justify-between mb-1.5">
                                <span className="text-xs font-medium opacity-80">Yoğunluk (Adet)</span>
                                <span className="text-xs font-mono font-bold text-green-500">{(particleCount / 1000).toFixed(1)}k</span>
                            </div>
                             <div className="relative h-1.5 w-full rounded-full bg-gray-500/20 overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${(particleCount - 20000) / (60000 - 20000) * 100}%` }}></div>
                                <input type="range" min="20000" max="60000" step="1000" value={particleCount} onChange={(e) => handleCountChange(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>
                        </div>

                        {/* Size */}
                        <div className="group">
                            <div className="flex justify-between mb-1.5">
                                <span className="text-xs font-medium opacity-80">Boyut</span>
                                <span className="text-xs font-mono font-bold text-yellow-500">{particleSize}px</span>
                            </div>
                            <div className="relative h-1.5 w-full rounded-full bg-gray-500/20 overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-yellow-500 rounded-full transition-all duration-300" style={{ width: `${(particleSize / 50) * 100}%` }}></div>
                                <input type="range" min="1" max="50" value={particleSize} onChange={(e) => onParticleSizeChange(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>
                        </div>
                        
                        {/* Model Density (Geri Getirilen Özellik) */}
                        <div className="group">
                            <div className="flex justify-between mb-1.5">
                                <span className="text-xs font-medium opacity-80">Form Sıkılığı</span>
                                <span className="text-xs font-mono font-bold text-orange-500">%{modelDensity}</span>
                            </div>
                            <div className="relative h-1.5 w-full rounded-full bg-gray-500/20 overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${modelDensity}%` }}></div>
                                <input type="range" min="0" max="100" value={modelDensity} onChange={(e) => onModelDensityChange(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Group 3: Görsel Efektler (Depth) */}
                {hasImage && (
                    <div>
                        <h5 className={`text-[10px] font-bold uppercase mb-3 opacity-60 flex items-center gap-2 ${isLightMode ? 'text-black' : 'text-white'}`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            Görsel Derinlik
                        </h5>
                        <div className="group">
                            <div className="flex justify-between mb-1.5">
                                <span className="text-xs font-medium opacity-80">3D Kabartma</span>
                                <span className="text-xs font-mono font-bold text-red-500">%{Math.round(depthIntensity * 10)}</span>
                            </div>
                            <div className="relative h-1.5 w-full rounded-full bg-gray-500/20 overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${(depthIntensity / 20) * 100}%` }}></div>
                                <input type="range" min="0" max="20" value={depthIntensity} onChange={(e) => onDepthChange(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={`mt-6 pt-4 border-t flex justify-end ${isLightMode ? 'border-black/10' : 'border-white/10'}`}>
                <button onClick={onResetAll} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-900/30 flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg> 
                    SIFIRLA
                </button>
            </div>
        </div>
      )}

      {/* --- ALT MENÜ (TAMAMLANDI) --- */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center items-center pointer-events-none z-[100] px-4">
        <div className={`pointer-events-auto w-full max-w-lg relative flex gap-2 items-center transition-transform duration-500 ${hideBottomClass}`} onPointerDown={stopProp}>
          {isPaletteOpen && (
            <div className="absolute bottom-full right-0 translate-x-2 mb-2 bg-black/80 backdrop-blur-xl border border-white/20 p-2 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200 origin-bottom-right" onMouseEnter={() => onInteractionStart()} onMouseLeave={() => { if(!isDrawing) onColorChange(savedColor); onInteractionEnd(); }}>
              <div className="text-white/60 text-[10px] mb-1 font-mono text-center">Renk Seçici</div>
              <div className="w-48 h-32 rounded-lg cursor-crosshair relative overflow-hidden shadow-inner border border-white/10" onMouseMove={handleSpectrumMove} onClick={handleSpectrumClick} style={{ background: 'white' }}>
                 <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }} />
                 <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%)' }} />
              </div>
            </div>
          )}
          
          {!isDrawing && (<button onClick={() => { setShowAudioModal(true); onInteractionStart(); }} className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 border ${audioMode !== 'none' ? 'bg-green-500/20 text-green-300 border-green-500/50' : isLightMode ? 'bg-black/5 hover:bg-black/10 border-black/20 hover:border-black/50 text-black/80' : 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/50 text-white'}`} title="Müzik/Ses Ekle" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animate-wiggle"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></button>)}
          {!isDrawing && (<button onClick={() => fileInputRef.current?.click()} className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 border ${isLightMode ? 'bg-black/5 hover:bg-black/10 border-black/20 hover:border-black/50 text-black/80' : 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/50 text-white'}`} title="Resim Yükle" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animate-bounce"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></button>)}
          <button onClick={isDrawing ? cancelDrawing : onDrawingStart} className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 border ${isDrawing ? 'bg-red-500/20 text-red-200 border-red-500/50 hover:bg-red-500/40' : isLightMode ? 'bg-black/5 hover:bg-black/10 border-black/20 hover:border-black/50 text-black/80' : 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/50 text-white'}`} title={isDrawing ? "Çizimi İptal Et" : "Çizim Yap"} onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}>{isDrawing ? (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animate-wiggle"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animate-bounce"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>)}</button>
          {!isDrawing ? (<input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} onFocus={() => onInteractionStart()} onBlur={() => onInteractionEnd()} placeholder="Metin yazın (Türkçe destekli)..." className={`flex-1 backdrop-blur-md border rounded-full px-6 py-4 outline-none transition-all duration-300 shadow-lg text-center font-light tracking-wide text-lg ${isLightMode ? 'bg-black/5 border-black/10 text-black placeholder-gray-500 focus:bg-black/10 focus:border-black/30' : 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 focus:border-white/50'}`} />) : (<div className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 text-center text-white/50 font-light tracking-wide text-lg select-none">3D Tuval Aktif</div>)}
          {isDrawing && (<button onClick={onDrawingConfirm} className="w-16 flex-shrink-0 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 hover:border-green-400 text-green-100 rounded-full px-2 py-4 transition-all duration-300 shadow-lg text-center font-light tracking-wide flex items-center justify-center gap-2 group" title="Çizimi Dönüştür"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform icon-animate-pulse"><polyline points="20 6 9 17 4 12"></polyline></svg></button>)}
          <div className="flex items-center gap-2">
            {hasImage && !isOriginalColors && !isDrawing && (<button onClick={onResetColors} className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-gradient-to-tr from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 transition-all duration-300 border border-white/20 hover:border-white/50 text-white/80 hover:text-white animate-in fade-in zoom-in group" title="Orijinal Renklere Dön" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animate-spin"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg></button>)}
            <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 border-2 z-20 group ${isLightMode ? 'bg-black/5 hover:bg-black/20 border-black/20 hover:border-black shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]' : 'bg-white/5 hover:bg-white/20 border-white/20 hover:border-white shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'}`} title="Renk Paletini Aç" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}><div className={`w-6 h-6 rounded-full shadow-sm icon-animate-pulse ${isLightMode ? 'border border-black/20' : 'border border-white/50'}`} style={{ backgroundColor: currentColor }} /></button>
             <button onClick={isDrawing ? onClearCanvas : onResetAll} className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 border group ${isDrawing ? 'bg-orange-500/10 hover:bg-orange-500/30 hover:border-orange-400 border-white/20 text-white/70 hover:text-white' : isLightMode ? 'bg-red-500/10 hover:bg-red-500/30 hover:border-red-400 border-black/20 text-black/70 hover:text-black' : 'bg-red-500/10 hover:bg-red-500/30 hover:border-red-400 border-white/20 text-white/70 hover:text-white'}`} title="Tuvali Temizle" onMouseEnter={onInteractionStart} onMouseLeave={onInteractionEnd}>{isDrawing ? (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animate-wiggle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animate-spin"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg>)}</button>
          </div>
        </div>
        {!isDrawing && (<div className={`absolute -bottom-6 text-center text-[10px] font-mono opacity-50 ${isLightMode ? 'text-black' : 'text-gray-500'}`}>Küre moduna dönmek için boş Enter</div>)}
      </div>

    </>
  );
};