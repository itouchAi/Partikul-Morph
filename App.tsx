import React, { useState, useEffect, useRef } from 'react';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import { ClockWidget } from './components/ClockWidget';
import { Screensaver } from './components/Screensaver';
import { PresetType, AudioMode, BackgroundMode, BgImageStyle, ShapeType, SlideshowSettings } from './types';

// Ekran Koruyucu Durumları (Kesin Sıralı - 5 Adım)
type ScreensaverState = 
    'idle' | 
    // GİRİŞ ADIMLARI
    'e1_app_blur' |      // 1. Ana ekran blur
    'e2_app_shrink' |    // 2. Ana ekran sıkışma - SS Opak ama aşağıda
    'e3_ss_slide_up' |   // 3. SS alttan gelme
    'e4_ss_unblur' |     // 4. SS netleşme
    'e5_ss_expand' |     // 5. SS büyüme
    'active' |           // Tam ekran aktif
    // ÇIKIŞ ADIMLARI (Tersi)
    'x1_ss_shrink' |     // 1. SS sıkışma
    'x2_ss_blur' |       // 2. SS blur
    'x3_ss_slide_down' | // 3. SS aşağı kayma
    'x4_app_expand' |    // 4. Ana ekran büyüme - SS aşağıda kalır
    'x5_app_unblur';     // 5. Ana ekran netleşme

const App: React.FC = () => {
  const [currentText, setCurrentText] = useState<string>('');
  const [widgetUserText, setWidgetUserText] = useState<string>(''); // Clock Widget Metni
  const [particleColor, setParticleColor] = useState<string>('#ffffff');
  
  // Arka Plan State'leri
  const [bgMode, setBgMode] = useState<BackgroundMode>('dark');
  const [customBgColor, setCustomBgColor] = useState<string>('#000000');
  
  // Çoklu Arka Plan Resmi Yönetimi
  const [bgImages, setBgImages] = useState<string[]>([]);
  const [bgImage, setBgImage] = useState<string | null>(null);
  
  // Slayt Gösterisi State
  const [slideshowSettings, setSlideshowSettings] = useState<SlideshowSettings>({
      active: false,
      duration: 5,
      order: 'sequential',
      transition: 'fade'
  });
  
  const [croppedBgImage, setCroppedBgImage] = useState<string | null>(null); 
  const [bgImageStyle, setBgImageStyle] = useState<BgImageStyle>('cover');
  const [isWidgetMinimized, setIsWidgetMinimized] = useState<boolean>(false);
  const [isUIHidden, setIsUIHidden] = useState<boolean>(false);
  const [isSceneVisible, setIsSceneVisible] = useState<boolean>(true);
  const [currentShape, setCurrentShape] = useState<ShapeType>('sphere');
  const [imageSourceXY, setImageSourceXY] = useState<string | null>(null);
  const [imageSourceYZ, setImageSourceYZ] = useState<string | null>(null);
  const [useImageColors, setUseImageColors] = useState<boolean>(false);
  const [depthIntensity, setDepthIntensity] = useState<number>(0); 
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [brushSize, setBrushSize] = useState<number>(10);
  const [canvasRotation, setCanvasRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [clearCanvasTrigger, setClearCanvasTrigger] = useState<number>(0);
  const [cameraResetTrigger, setCameraResetTrigger] = useState<number>(0);
  const getDrawingDataRef = useRef<{ getXY: () => string, getYZ: () => string } | null>(null);
  const [activePreset, setActivePreset] = useState<PresetType>('none');
  const [audioMode, setAudioMode] = useState<AudioMode>('none');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioTitle, setAudioTitle] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.5);
  const [repulsionStrength, setRepulsionStrength] = useState<number>(50);
  const [repulsionRadius, setRepulsionRadius] = useState<number>(50);
  const [particleCount, setParticleCount] = useState<number>(40000); 
  const [particleSize, setParticleSize] = useState<number>(20); 
  const [modelDensity, setModelDensity] = useState<number>(50); 
  const [isUIInteraction, setIsUIInteraction] = useState<boolean>(false);

  // --- Screensaver State ---
  const [ssState, setSsState] = useState<ScreensaverState>('idle');
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Screensaver Settings
  const [ssBgColor, setSsBgColor] = useState('#000000');
  const [ssTextColor, setSsTextColor] = useState('#ffffff');

  // --- Slayt Gösterisi Mantığı ---
  useEffect(() => {
      let intervalId: any;

      if (slideshowSettings.active && bgImages.length > 1 && bgMode === 'image') {
          intervalId = setInterval(() => {
              setBgImages(currentImages => {
                  if (currentImages.length <= 1) return currentImages;
                  setBgImage(currentImg => {
                      const currentIndex = currentImages.indexOf(currentImg || '');
                      let nextIndex = 0;
                      if (slideshowSettings.order === 'random') {
                          do { nextIndex = Math.floor(Math.random() * currentImages.length); } while (nextIndex === currentIndex && currentImages.length > 1);
                      } else {
                          nextIndex = (currentIndex + 1) % currentImages.length;
                      }
                      return currentImages[nextIndex];
                  });
                  return currentImages;
              });
              setCroppedBgImage(null);
          }, Math.max(3000, slideshowSettings.duration * 1000));
      }
      return () => { if (intervalId) clearInterval(intervalId); };
  }, [slideshowSettings, bgImages.length, bgMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePreset('none');
        if (isDrawing) setIsDrawing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing]);

  // --- EKRAN KORUYUCU TETİKLEME MANTIĞI (Mouse Hover) ---
  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          // Sadece IDLE durumundayken tetiklenir
          if (ssState !== 'idle') return;

          const threshold = 10; // Piksel
          const isTop = e.clientY <= threshold;
          const isBottom = e.clientY >= window.innerHeight - threshold;

          if (isTop || isBottom) {
              if (!hoverTimerRef.current) {
                  hoverTimerRef.current = setTimeout(() => {
                      // Tetiklemeyi başlat
                      setSsState('e1_app_blur');
                  }, 2000); // Kursor 2 saniye beklerse başla (BURASI 2sn KALDI)
              }
          } else {
              if (hoverTimerRef.current) {
                  clearTimeout(hoverTimerRef.current);
                  hoverTimerRef.current = null;
              }
          }
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      };
  }, [ssState]); 

  // --- EKRAN KORUYUCU GEÇİŞ ZİNCİRİ (State-Driven Animation) ---
  // Tüm geçişler 0.25sn (250ms) + 50ms buffer = 300ms yapıldı
  useEffect(() => {
      let timer: ReturnType<typeof setTimeout>;

      // GİRİŞ DİZİSİ
      if (ssState === 'e1_app_blur') {
          timer = setTimeout(() => setSsState('e2_app_shrink'), 300);
      } else if (ssState === 'e2_app_shrink') {
          timer = setTimeout(() => setSsState('e3_ss_slide_up'), 300);
      } else if (ssState === 'e3_ss_slide_up') {
          timer = setTimeout(() => setSsState('e4_ss_unblur'), 300);
      } else if (ssState === 'e4_ss_unblur') {
          timer = setTimeout(() => setSsState('e5_ss_expand'), 300);
      } else if (ssState === 'e5_ss_expand') {
          timer = setTimeout(() => setSsState('active'), 300);
      }

      // ÇIKIŞ DİZİSİ
      else if (ssState === 'x1_ss_shrink') {
          timer = setTimeout(() => setSsState('x2_ss_blur'), 300);
      } else if (ssState === 'x2_ss_blur') {
          timer = setTimeout(() => setSsState('x3_ss_slide_down'), 300);
      } else if (ssState === 'x3_ss_slide_down') {
          timer = setTimeout(() => setSsState('x4_app_expand'), 300);
      } else if (ssState === 'x4_app_expand') {
          timer = setTimeout(() => setSsState('x5_app_unblur'), 300);
      } else if (ssState === 'x5_app_unblur') {
          timer = setTimeout(() => setSsState('idle'), 300);
      }

      return () => {
          if (timer) clearTimeout(timer);
      };
  }, [ssState]);

  const handleScreensaverClick = () => {
      if (ssState !== 'active') return;
      // Çıkış dizisini başlat
      setSsState('x1_ss_shrink');
  };

  // Tema Değişikliği Mantığı
  const handleBgModeChange = (mode: BackgroundMode, extraData?: string) => {
      setBgMode(mode);
      if (mode === 'light') {
          setParticleColor('#000000');
          setUseImageColors(false); 
      } else if (mode === 'dark') {
          setParticleColor('#ffffff');
      }
      if (mode === 'image' && extraData) {
          setBgImage(extraData);
          setCroppedBgImage(null);
      }
      if (mode === 'color' && extraData) {
          setCustomBgColor(extraData);
      }
  };

  // ... (Helper functions remain same)
  const handleBgImagesAdd = (newImages: string[]) => {
      setBgImages(prev => [...prev, ...newImages]);
      if (!bgImage && newImages.length > 0) { setBgImage(newImages[0]); setCroppedBgImage(null); setBgMode('image'); }
  };
  const handleBgImageSelectFromDeck = (img: string) => { setBgImage(img); setCroppedBgImage(null); setBgMode('image'); };
  const handleApplyCrop = (croppedDataUrl: string) => { setCroppedBgImage(croppedDataUrl); setBgMode('image'); };
  const handleRemoveBgImage = (imgToRemove: string) => {
      setBgImages(prev => {
          const newList = prev.filter(img => img !== imgToRemove);
          if (bgImage === imgToRemove) {
              if (newList.length > 0) { setBgImage(newList[0]); setCroppedBgImage(null); } else { setBgImage(null); setCroppedBgImage(null); setBgMode('dark'); }
          }
          return newList;
      });
  };
  const handleDeckReset = (deleteImages: boolean, resetSize: boolean) => {
      if (deleteImages) { setBgImages([]); setBgImage(null); setCroppedBgImage(null); setBgMode('dark'); setSlideshowSettings(prev => ({ ...prev, active: false })); }
      if (resetSize) { setBgImageStyle('cover'); setCroppedBgImage(null); }
  };
  const handleBgImageStyleChange = (style: BgImageStyle) => { setBgImageStyle(style); if (style !== 'cover') setCroppedBgImage(null); };
  const handleTextSubmit = (text: string) => {
    setCurrentText(text); setImageSourceXY(null); setImageSourceYZ(null); setDepthIntensity(0); setIsDrawing(false); setCanvasRotation([0, 0, 0]); setCameraResetTrigger(prev => prev + 1); setIsSceneVisible(true); 
  };
  const handleDualImageUpload = (imgXY: string | null, imgYZ: string | null, useOriginalColors: boolean, keepRotation = false) => {
    setImageSourceXY(imgXY); setImageSourceYZ(imgYZ); setUseImageColors(useOriginalColors); setCurrentText(''); setActivePreset('none'); setIsSceneVisible(true);
    if (isDrawing) { setDepthIntensity(0); setIsDrawing(false); if (!keepRotation) setCanvasRotation([0, 0, 0]); } else { setDepthIntensity(0); setCanvasRotation([0, 0, 0]); }
  };
  const handleImageUpload = (imgSrc: string, useOriginalColors: boolean) => { handleDualImageUpload(imgSrc, null, useOriginalColors, false); };
  const handleDrawingStart = () => {
    setCurrentText(''); setImageSourceXY(null); setImageSourceYZ(null); setUseImageColors(false); setIsDrawing(true); setParticleColor(particleColor); setCanvasRotation([0, 0, 0]); setClearCanvasTrigger(prev => prev + 1); setIsSceneVisible(true);
  };
  const handleDrawingConfirm = () => {
    if (getDrawingDataRef.current) { const dataUrlXY = getDrawingDataRef.current.getXY(); const dataUrlYZ = getDrawingDataRef.current.getYZ(); handleDualImageUpload(dataUrlXY, dataUrlYZ, true, true); }
  };
  const handleColorChange = (color: string) => { setParticleColor(color); setActivePreset('none'); if ((imageSourceXY || imageSourceYZ) && !isDrawing) setUseImageColors(false); };
  const handleResetColors = () => { if (imageSourceXY || imageSourceYZ) setUseImageColors(true); };
  const handleAudioChange = (mode: AudioMode, url: string | null, title?: string) => { setAudioMode(mode); setAudioUrl(url); setAudioTitle(title || null); setIsPlaying(true); };
  const handleClearCanvas = () => { setClearCanvasTrigger(prev => prev + 1); };
  const handleShapeChange = (shape: ShapeType) => { setCurrentShape(shape); setCurrentText(''); setImageSourceXY(null); setImageSourceYZ(null); setUseImageColors(false); setDepthIntensity(0); setIsSceneVisible(true); };
  const handleResetAll = () => {
    setCurrentText(''); setParticleColor('#ffffff'); setImageSourceXY(null); setImageSourceYZ(null); setUseImageColors(false); setDepthIntensity(0); setActivePreset('none'); setAudioMode('none'); setAudioUrl(null); setAudioTitle(null); setIsPlaying(true); setRepulsionStrength(50); setRepulsionRadius(50); setParticleCount(40000); setParticleSize(20); setModelDensity(50); setIsDrawing(false); setCanvasRotation([0, 0, 0]); setCurrentShape('sphere'); setCameraResetTrigger(prev => prev + 1); setBgMode('dark'); setIsSceneVisible(true); setBgImage(null); setCroppedBgImage(null); setSlideshowSettings(prev => ({...prev, active: false}));
  };
  const rotateCanvasX = () => setCanvasRotation(prev => [prev[0] + Math.PI / 2, prev[1], prev[2]]);
  const rotateCanvasY = () => setCanvasRotation(prev => [prev[0], prev[1] + Math.PI / 2, prev[2]]);
  const rotateCanvasZ = () => setCanvasRotation(prev => [prev[0], prev[1], prev[2] + Math.PI / 2]);

  const displayImage = bgMode === 'image' ? (croppedBgImage || bgImage) : null;
  const getTransitionClass = () => {
      if (!slideshowSettings.active) return 'transition-opacity duration-700';
      let t = slideshowSettings.transition;
      if (t === 'random') { const effects = ['slide-left', 'slide-right', 'slide-up', 'slide-down', 'fade', 'blur', 'transform']; t = effects[Math.floor(Math.random() * effects.length)] as any; }
      switch (t) { case 'slide-left': return 'animate-slide-left'; case 'slide-right': return 'animate-slide-right'; case 'slide-up': return 'animate-slide-up'; case 'slide-down': return 'animate-slide-down'; case 'fade': return 'animate-fade-in-out'; case 'blur': return 'animate-blur-in-out'; case 'transform': return 'animate-transform-zoom'; case 'particles': return 'animate-pixelate'; default: return 'transition-all duration-1000'; }
  };

  // --- STİL VE ANİMASYON HESAPLAMALARI ---
  
  // Varsayılan Stiller (0.25sn)
  let appDuration = '0.25s';
  let ssDuration = '0.25s';

  // App Layer Başlangıç (Idle)
  let appFilter = 'blur(0px) brightness(1)';
  let appTransform = 'scale(1)';
  let appInset = '0px';
  let appRadius = '0px';

  // SS Layer Başlangıç (Idle - Gizli)
  let ssTransform = 'translateY(100%)'; // Ekranın altında
  let ssInset = '20px'; // Kenarlardan sıkışık
  let ssBlur = 'blur(10px)';
  let ssOpacity = '0'; // Görünmez
  let ssPointer = 'none';
  let ssRadius = '30px';
  let ssScale = '0.95';

  // --- DURUM MAKİNESİNE GÖRE STİLLER ---

  switch (ssState) {
      case 'idle':
          // Her şey normal
          break;

      // --- GİRİŞ ---
      case 'e1_app_blur':
          // 1. ADIM: ÖNCE SIKIŞMA (Blur Yok)
          appDuration = '0.25s';
          appFilter = 'blur(0px) brightness(1)'; 
          appInset = '20px'; // Sıkışma
          appRadius = '30px';
          appTransform = 'scale(0.95)';
          break;

      case 'e2_app_shrink':
          // 2. ADIM: SONRA BLUR
          appDuration = '0.25s';
          appFilter = 'blur(10px) brightness(0.7)'; // Blur eklendi
          appInset = '20px';
          appRadius = '30px';
          appTransform = 'scale(0.95)';
          
          // SS hazırlığı
          ssDuration = '0.25s';
          ssOpacity = '1'; 
          ssTransform = 'translateY(100%)'; 
          ssBlur = 'blur(10px)';
          break;

      case 'e3_ss_slide_up':
          appFilter = 'blur(10px) brightness(0.5)';
          appInset = '20px';
          appRadius = '30px';
          appTransform = 'scale(0.95)';
          
          ssDuration = '0.25s';
          ssOpacity = '1';
          ssTransform = 'translateY(0)'; // Yukarı çıkar
          ssInset = '20px';
          ssBlur = 'blur(10px)';
          ssRadius = '30px';
          ssScale = '0.95';
          break;

      case 'e4_ss_unblur':
          appFilter = 'blur(10px) brightness(0.5)';
          appInset = '20px';
          appRadius = '30px';
          appTransform = 'scale(0.95)';

          ssDuration = '0.25s';
          ssOpacity = '1';
          ssTransform = 'translateY(0)';
          ssBlur = 'blur(0px)'; // Netleşir
          ssInset = '20px';
          ssRadius = '30px';
          ssScale = '0.95';
          break;

      case 'e5_ss_expand':
          appFilter = 'blur(10px) brightness(0.5)';
          appInset = '20px';
          appRadius = '30px';
          appTransform = 'scale(0.95)';

          ssDuration = '0.25s';
          ssOpacity = '1';
          ssTransform = 'translateY(0)';
          ssBlur = 'blur(0px)';
          ssInset = '0px'; // Genişler
          ssRadius = '0px';
          ssScale = '1';
          break;

      case 'active':
          appFilter = 'blur(10px) brightness(0.5)';
          appInset = '20px';
          appRadius = '30px';
          appTransform = 'scale(0.95)';
          
          ssOpacity = '1';
          ssPointer = 'auto';
          ssTransform = 'translateY(0)';
          ssBlur = 'blur(0px)';
          ssInset = '0px';
          ssRadius = '0px';
          ssScale = '1';
          break;

      // --- ÇIKIŞ ---
      case 'x1_ss_shrink':
          appFilter = 'blur(10px) brightness(0.5)';
          appInset = '20px';
          appRadius = '30px';
          appTransform = 'scale(0.95)';

          ssDuration = '0.25s';
          ssOpacity = '1';
          ssTransform = 'translateY(0)';
          ssBlur = 'blur(0px)';
          ssInset = '20px'; // Sıkışır
          ssRadius = '30px';
          ssScale = '0.95';
          break;

      case 'x2_ss_blur':
          appFilter = 'blur(10px) brightness(0.5)';
          appInset = '20px';
          appRadius = '30px';
          appTransform = 'scale(0.95)';

          ssDuration = '0.25s';
          ssOpacity = '1';
          ssTransform = 'translateY(0)';
          ssBlur = 'blur(10px)'; // Bulanıklaşır
          ssInset = '20px';
          ssRadius = '30px';
          ssScale = '0.95';
          break;

      case 'x3_ss_slide_down':
          appFilter = 'blur(10px) brightness(0.5)';
          appInset = '20px';
          appRadius = '30px';
          appTransform = 'scale(0.95)';

          ssDuration = '0.25s';
          ssOpacity = '1'; 
          ssTransform = 'translateY(100%)'; // Aşağı gider
          ssBlur = 'blur(10px)';
          ssInset = '20px';
          ssRadius = '30px';
          ssScale = '0.95';
          break;

      case 'x4_app_expand':
          ssOpacity = '1'; 
          ssTransform = 'translateY(100%)';
          
          appDuration = '0.25s';
          appFilter = 'blur(10px) brightness(0.7)'; 
          appInset = '0px'; // Genişler
          appRadius = '0px';
          appTransform = 'scale(1)';
          break;

      case 'x5_app_unblur':
          ssOpacity = '0';
          ssDuration = '0.25s';

          appDuration = '0.25s';
          appFilter = 'blur(0px) brightness(1)'; // Netleşir
          appInset = '0px';
          appRadius = '0px';
          appTransform = 'scale(1)';
          break;
  }

  // Stilleri Nesneye Dönüştür
  const appLayerStyle: React.CSSProperties = {
      transition: `all ${appDuration} cubic-bezier(0.4, 0, 0.2, 1)`,
      position: 'absolute',
      overflow: 'hidden',
      zIndex: 0,
      
      // Dinamik Özellikler
      filter: appFilter,
      transform: appTransform,
      top: appInset !== '0px' ? appInset : 0,
      left: appInset !== '0px' ? appInset : 0,
      right: appInset !== '0px' ? appInset : 0,
      bottom: appInset !== '0px' ? appInset : 0,
      width: appInset !== '0px' ? `calc(100% - ${parseInt(appInset)*2}px)` : '100%',
      height: appInset !== '0px' ? `calc(100% - ${parseInt(appInset)*2}px)` : '100%',
      borderRadius: appRadius
  };

  const ssLayerStyle: React.CSSProperties = {
      transition: `all ${ssDuration} cubic-bezier(0.4, 0, 0.2, 1)`,
      position: 'absolute',
      zIndex: 100,
      
      // Dinamik Özellikler
      opacity: ssOpacity,
      pointerEvents: ssPointer as any,
      
      // Transform ve Scale kombinasyonu
      transform: ssTransform.includes('translate') ? `${ssTransform} scale(${ssScale})` : ssTransform,
      
      // Inset yapısı
      top: ssInset !== '0px' ? ssInset : 0,
      left: ssInset !== '0px' ? ssInset : 0,
      right: ssInset !== '0px' ? ssInset : 0,
      bottom: ssInset !== '0px' ? ssInset : 0,
      width: ssInset !== '0px' ? `calc(100% - ${parseInt(ssInset)*2}px)` : '100%',
      height: ssInset !== '0px' ? `calc(100% - ${parseInt(ssInset)*2}px)` : '100%',
      
      filter: ssBlur,
      borderRadius: ssRadius,
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <style>{`
          @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
          @keyframes colorCycle { 0% { background-color: #ff0000; } 20% { background-color: #ffff00; } 40% { background-color: #00ff00; } 60% { background-color: #00ffff; } 80% { background-color: #0000ff; } 100% { background-color: #ff00ff; } }
          .animate-color-cycle { animation: colorCycle 10s infinite alternate linear; }
          /* ... (Diğer animasyonlar) ... */
          @keyframes slide-left { 0% { transform: translateX(100%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } } .animate-slide-left { animation: slide-left 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          @keyframes slide-right { 0% { transform: translateX(-100%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } } .animate-slide-right { animation: slide-right 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          @keyframes slide-up { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } } .animate-slide-up { animation: slide-up 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          @keyframes slide-down { 0% { transform: translateY(-100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } } .animate-slide-down { animation: slide-down 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          @keyframes fade-in-out { 0% { opacity: 0; } 100% { opacity: 1; } } .animate-fade-in-out { animation: fade-in-out 1.5s ease-in-out forwards; }
          @keyframes blur-in-out { 0% { filter: blur(20px); opacity: 0; } 100% { filter: blur(0px); opacity: 1; } } .animate-blur-in-out { animation: blur-in-out 1.2s ease-out forwards; }
          @keyframes transform-zoom { 0% { transform: scale(1.5) rotate(5deg); opacity: 0; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } } .animate-transform-zoom { animation: transform-zoom 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          @keyframes pixelate { 0% { filter: contrast(200%) brightness(500%) saturate(0); opacity: 0; transform: scale(1.2); } 50% { filter: contrast(100%) brightness(100%) saturate(1); opacity: 1; transform: scale(1); } 100% { opacity: 1; } } .animate-pixelate { animation: pixelate 1s steps(10) forwards; }
      `}</style>

      {/* --- ANA UYGULAMA KATMANI --- */}
      <div 
        id="app-layer"
        style={appLayerStyle}
        className="bg-black shadow-2xl"
      >
          {/* İçerik */}
          <div className="relative w-full h-full overflow-hidden">
            <div className="absolute inset-0 z-0 transition-colors duration-1000 ease-in-out"
                style={{
                    backgroundColor: bgMode === 'dark' ? '#000' : 
                                        bgMode === 'light' ? '#fff' :
                                        bgMode === 'color' ? customBgColor : 'transparent'
                }}
            >
                {displayImage && (
                    <img 
                        key={displayImage}
                        src={displayImage} 
                        alt="background" 
                        className={`w-full h-full object-cover select-none pointer-events-none ${getTransitionClass()}`}
                        style={{ objectFit: bgImageStyle, objectPosition: 'center center' }}
                    />
                )}
                {bgMode === 'gradient' && ( <div className="w-full h-full bg-[linear-gradient(45deg,#ff0000,#ff7300,#fffb00,#48ff00,#00ffd5,#002bff,#7a00ff,#ff00c8,#ff0000)] bg-[length:400%_400%] animate-gradient-xy opacity-80" style={{ animation: 'gradientMove 15s ease infinite' }} /> )}
                {bgMode === 'auto' && ( <div className="w-full h-full animate-color-cycle" /> )}
            </div>
            
            <ClockWidget 
                isMinimized={isWidgetMinimized} 
                onToggleMinimize={() => setIsWidgetMinimized(!isWidgetMinimized)} 
                bgMode={bgMode} 
                bgImageStyle={bgImageStyle} 
                isUIHidden={isUIHidden} 
                ssBgColor={ssBgColor}
                setSsBgColor={setSsBgColor}
                ssTextColor={ssTextColor}
                setSsTextColor={setSsTextColor}
                userText={widgetUserText} 
                onUserTextChange={setWidgetUserText}
            />

            <div className="absolute inset-0 z-10">
                <Experience text={currentText} imageXY={imageSourceXY} imageYZ={imageSourceYZ} useImageColors={useImageColors} particleColor={particleColor} disableInteraction={isUIInteraction} depthIntensity={depthIntensity} repulsionStrength={repulsionStrength} repulsionRadius={repulsionRadius} particleCount={particleCount} particleSize={particleSize} modelDensity={modelDensity} activePreset={activePreset} audioMode={audioMode} audioUrl={audioUrl} isPlaying={isPlaying} volume={volume} isDrawing={isDrawing} brushSize={brushSize} getDrawingDataRef={getDrawingDataRef} canvasRotation={canvasRotation} clearCanvasTrigger={clearCanvasTrigger} currentShape={currentShape} cameraResetTrigger={cameraResetTrigger} isSceneVisible={isSceneVisible} />
            </div>
            
            <UIOverlay onSubmit={handleTextSubmit} onImageUpload={handleImageUpload} onDrawingStart={handleDrawingStart} onDrawingConfirm={handleDrawingConfirm} isDrawing={isDrawing} brushSize={brushSize} onBrushSizeChange={setBrushSize} canvasRotation={canvasRotation} onRotateX={rotateCanvasX} onRotateY={rotateCanvasY} onRotateZ={rotateCanvasZ} currentColor={particleColor} onColorChange={handleColorChange} onResetColors={handleResetColors} isOriginalColors={useImageColors} onInteractionStart={() => setIsUIInteraction(true)} onInteractionEnd={() => setIsUIInteraction(false)} hasImage={!!imageSourceXY || !!imageSourceYZ} depthIntensity={depthIntensity} onDepthChange={setDepthIntensity} repulsionStrength={repulsionStrength} onRepulsionChange={setRepulsionStrength} repulsionRadius={repulsionRadius} onRadiusChange={setRepulsionRadius} particleCount={particleCount} onParticleCountChange={setParticleCount} particleSize={particleSize} onParticleSizeChange={setParticleSize} modelDensity={modelDensity} onModelDensityChange={setModelDensity} activePreset={activePreset} onPresetChange={setActivePreset} onAudioChange={handleAudioChange} audioMode={audioMode} audioTitle={audioTitle} isPlaying={isPlaying} onTogglePlay={() => setIsPlaying(!isPlaying)} volume={volume} onVolumeChange={setVolume} onResetAll={handleResetAll} onClearCanvas={handleClearCanvas} bgMode={bgMode} onBgModeChange={handleBgModeChange} onBgImageConfirm={(img, style) => {}} customBgColor={customBgColor} currentShape={currentShape} onShapeChange={handleShapeChange} isWidgetMinimized={isWidgetMinimized} isUIHidden={isUIHidden} onToggleUI={() => setIsUIHidden(!isUIHidden)} isSceneVisible={isSceneVisible} onToggleScene={() => setIsSceneVisible(!isSceneVisible)} bgImages={bgImages} onBgImagesAdd={handleBgImagesAdd} onBgImageSelect={handleBgImageSelectFromDeck} onBgImageStyleChange={handleBgImageStyleChange} bgImageStyle={bgImageStyle} onRemoveBgImage={handleRemoveBgImage} onBgTransformChange={handleApplyCrop} onResetDeck={handleDeckReset} slideshowSettings={slideshowSettings} onSlideshowSettingsChange={setSlideshowSettings} />
          </div>
      </div>

      {/* --- EKRAN KORUYUCU KATMANI --- */}
      <div id="screensaver-layer" style={ssLayerStyle} className="shadow-2xl">
          <Screensaver active={ssState === 'active' || ssState.startsWith('e') || ssState.startsWith('x')} onClick={handleScreensaverClick} bgColor={ssBgColor} textColor={ssTextColor} userText={widgetUserText} />
      </div>

    </div>
  );
};

export default App;