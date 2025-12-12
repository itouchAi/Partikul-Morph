import React, { useState, useEffect, useRef } from 'react';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import { ClockWidget } from './components/ClockWidget';
import { PresetType, AudioMode, BackgroundMode, BgImageStyle, ShapeType, SlideshowSettings } from './types';

const App: React.FC = () => {
  const [currentText, setCurrentText] = useState<string>('');
  const [particleColor, setParticleColor] = useState<string>('#ffffff');
  
  // Arka Plan State'leri
  const [bgMode, setBgMode] = useState<BackgroundMode>('dark');
  const [customBgColor, setCustomBgColor] = useState<string>('#000000');
  
  // Çoklu Arka Plan Resmi Yönetimi
  const [bgImages, setBgImages] = useState<string[]>([]); // Yüklü resimler listesi (Deste)
  const [bgImage, setBgImage] = useState<string | null>(null); // Desteden seçilen aktif resim
  
  // Slayt Gösterisi State
  const [slideshowSettings, setSlideshowSettings] = useState<SlideshowSettings>({
      active: false,
      duration: 5,
      order: 'sequential',
      transition: 'fade'
  });
  
  // GİZLİ GALERİ (Kırpılmış Resim Hafızası) - Tek bir slot
  const [croppedBgImage, setCroppedBgImage] = useState<string | null>(null); 

  const [bgImageStyle, setBgImageStyle] = useState<BgImageStyle>('cover');
  
  // Widget State
  const [isWidgetMinimized, setIsWidgetMinimized] = useState<boolean>(false);

  // UI Gizleme (Clean Mode) State'i
  const [isUIHidden, setIsUIHidden] = useState<boolean>(false);
  
  // Sahne Nesnesi Gizleme (VFX Toggle) State'i
  const [isSceneVisible, setIsSceneVisible] = useState<boolean>(true);

  // Şekil State'i
  const [currentShape, setCurrentShape] = useState<ShapeType>('sphere');

  // Görüntü Kaynakları
  const [imageSourceXY, setImageSourceXY] = useState<string | null>(null);
  const [imageSourceYZ, setImageSourceYZ] = useState<string | null>(null);

  const [useImageColors, setUseImageColors] = useState<boolean>(false);
  const [depthIntensity, setDepthIntensity] = useState<number>(0); 
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  
  // Çizim Ayarları
  const [brushSize, setBrushSize] = useState<number>(10);
  const [canvasRotation, setCanvasRotation] = useState<[number, number, number]>([0, 0, 0]);
  
  const [clearCanvasTrigger, setClearCanvasTrigger] = useState<number>(0);
  const [cameraResetTrigger, setCameraResetTrigger] = useState<number>(0);
  
  const getDrawingDataRef = useRef<{ getXY: () => string, getYZ: () => string } | null>(null);

  // Efekt Presets
  const [activePreset, setActivePreset] = useState<PresetType>('none');

  // Ses Ayarları
  const [audioMode, setAudioMode] = useState<AudioMode>('none');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioTitle, setAudioTitle] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.5); // 0.0 to 1.0

  // Ayarlar
  const [repulsionStrength, setRepulsionStrength] = useState<number>(50);
  const [repulsionRadius, setRepulsionRadius] = useState<number>(50);
  const [particleCount, setParticleCount] = useState<number>(40000); 
  
  const [particleSize, setParticleSize] = useState<number>(20); 
  const [modelDensity, setModelDensity] = useState<number>(50); 

  const [isUIInteraction, setIsUIInteraction] = useState<boolean>(false);

  // --- Slayt Gösterisi Mantığı ---
  useEffect(() => {
      let intervalId: any;

      if (slideshowSettings.active && bgImages.length > 1 && bgMode === 'image') {
          intervalId = setInterval(() => {
              setBgImages(currentImages => {
                  if (currentImages.length <= 1) return currentImages;
                  
                  // Aktif resmin indeksini bul
                  // Not: setBgImage closure içinde eski değeri görebilir, bu yüzden setBgImage içinde işlem yapmak daha güvenli ama
                  // burada bgImage state'i dışarıda. Basitlik adına bgImages üzerinden index bulup ilerleyeceğiz.
                  
                  setBgImage(currentImg => {
                      const currentIndex = currentImages.indexOf(currentImg || '');
                      let nextIndex = 0;

                      if (slideshowSettings.order === 'random') {
                          do {
                              nextIndex = Math.floor(Math.random() * currentImages.length);
                          } while (nextIndex === currentIndex && currentImages.length > 1);
                      } else {
                          nextIndex = (currentIndex + 1) % currentImages.length;
                      }
                      
                      return currentImages[nextIndex];
                  });
                  
                  return currentImages;
              });
              
              // Slayt değiştiğinde kırpılmış resmi sıfırla (orijinale dön)
              setCroppedBgImage(null);

          }, Math.max(3000, slideshowSettings.duration * 1000));
      }

      return () => {
          if (intervalId) clearInterval(intervalId);
      };
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

  // Tema Değişikliği Mantığı
  const handleBgModeChange = (mode: BackgroundMode, extraData?: string) => {
      setBgMode(mode);
      
      // Aydınlık Mod: Partikülleri Siyah Yap
      if (mode === 'light') {
          setParticleColor('#000000');
          setUseImageColors(false); 
      } 
      // Karanlık Mod: Partikülleri Beyaz Yap
      else if (mode === 'dark') {
          setParticleColor('#ffffff');
      }
      
      // Diğer modlar için özel veri atamaları
      if (mode === 'image' && extraData) {
          setBgImage(extraData);
          setCroppedBgImage(null); // Mod değişince kırpma sıfırlanır
      }
      if (mode === 'color' && extraData) {
          setCustomBgColor(extraData);
      }
  };

  const handleBgImagesAdd = (newImages: string[]) => {
      setBgImages(prev => [...prev, ...newImages]);
      // Eğer hiç resim seçili değilse ve yeni resim eklendiyse, ilkini seç
      if (!bgImage && newImages.length > 0) {
          setBgImage(newImages[0]);
          setCroppedBgImage(null);
          setBgMode('image');
      }
  };

  const handleBgImageSelectFromDeck = (img: string) => {
      setBgImage(img);
      setCroppedBgImage(null); // Yeni kart seçilince gizli galeri temizlenir (orijinal görünür)
      setBgMode('image');
  };

  // Gizli Galeriye Kayıt
  const handleApplyCrop = (croppedDataUrl: string) => {
      setCroppedBgImage(croppedDataUrl); 
      setBgMode('image');
  };

  const handleRemoveBgImage = (imgToRemove: string) => {
      setBgImages(prev => {
          const newList = prev.filter(img => img !== imgToRemove);
          // Eğer aktif resim silindiyse
          if (bgImage === imgToRemove) {
              if (newList.length > 0) {
                  setBgImage(newList[0]);
                  setCroppedBgImage(null);
              } else {
                  setBgImage(null);
                  setCroppedBgImage(null);
                  setBgMode('dark');
              }
          }
          return newList;
      });
  };

  const handleDeckReset = (deleteImages: boolean, resetSize: boolean) => {
      if (deleteImages) {
          setBgImages([]);
          setBgImage(null);
          setCroppedBgImage(null);
          setBgMode('dark');
          setSlideshowSettings(prev => ({ ...prev, active: false })); // Stop slideshow
      }
      if (resetSize) {
          setBgImageStyle('cover');
          setCroppedBgImage(null); // Boyut resetlenince orijinal döner
      }
  };

  const handleBgImageStyleChange = (style: BgImageStyle) => {
      setBgImageStyle(style);
      if (style !== 'cover') {
         setCroppedBgImage(null); 
      }
  };
  
  const handleTextSubmit = (text: string) => {
    setCurrentText(text);
    setImageSourceXY(null);
    setImageSourceYZ(null);
    setDepthIntensity(0);
    setIsDrawing(false);
    setCanvasRotation([0, 0, 0]);
    setCameraResetTrigger(prev => prev + 1);
    setIsSceneVisible(true); 
  };

  const handleDualImageUpload = (imgXY: string | null, imgYZ: string | null, useOriginalColors: boolean, keepRotation = false) => {
    setImageSourceXY(imgXY);
    setImageSourceYZ(imgYZ);
    setUseImageColors(useOriginalColors);
    setCurrentText('');
    setActivePreset('none');
    setIsSceneVisible(true);
    
    if (isDrawing) {
        setDepthIntensity(0); 
        setIsDrawing(false);
        if (!keepRotation) {
            setCanvasRotation([0, 0, 0]);
        }
    } else {
        setDepthIntensity(0);
        setCanvasRotation([0, 0, 0]);
    }
  };

  const handleImageUpload = (imgSrc: string, useOriginalColors: boolean) => {
      handleDualImageUpload(imgSrc, null, useOriginalColors, false);
  };

  const handleDrawingStart = () => {
    setCurrentText('');
    setImageSourceXY(null);
    setImageSourceYZ(null);
    setUseImageColors(false);
    setIsDrawing(true);
    setParticleColor(particleColor); 
    setCanvasRotation([0, 0, 0]);
    setClearCanvasTrigger(prev => prev + 1);
    setIsSceneVisible(true);
  };

  const handleDrawingConfirm = () => {
    if (getDrawingDataRef.current) {
        const dataUrlXY = getDrawingDataRef.current.getXY();
        const dataUrlYZ = getDrawingDataRef.current.getYZ();
        handleDualImageUpload(dataUrlXY, dataUrlYZ, true, true);
    }
  };

  const handleColorChange = (color: string) => {
    setParticleColor(color);
    setActivePreset('none'); 
    if ((imageSourceXY || imageSourceYZ) && !isDrawing) {
      setUseImageColors(false);
    }
  };

  const handleResetColors = () => {
    if (imageSourceXY || imageSourceYZ) {
      setUseImageColors(true);
    }
  };

  const handleAudioChange = (mode: AudioMode, url: string | null, title?: string) => {
    setAudioMode(mode);
    setAudioUrl(url);
    setAudioTitle(title || null);
    setIsPlaying(true); 
  };

  const handleClearCanvas = () => {
      setClearCanvasTrigger(prev => prev + 1);
  };

  const handleShapeChange = (shape: ShapeType) => {
      setCurrentShape(shape);
      setCurrentText('');
      setImageSourceXY(null);
      setImageSourceYZ(null);
      setUseImageColors(false);
      setDepthIntensity(0);
      setIsSceneVisible(true);
  };

  const handleResetAll = () => {
    setCurrentText('');
    setParticleColor('#ffffff');
    setImageSourceXY(null);
    setImageSourceYZ(null);
    setUseImageColors(false);
    setDepthIntensity(0);
    setActivePreset('none');
    setAudioMode('none');
    setAudioUrl(null);
    setAudioTitle(null);
    setIsPlaying(true);
    setRepulsionStrength(50);
    setRepulsionRadius(50);
    setParticleCount(40000);
    setParticleSize(20);
    setModelDensity(50);
    setIsDrawing(false);
    setCanvasRotation([0, 0, 0]);
    setCurrentShape('sphere');
    setCameraResetTrigger(prev => prev + 1);
    setBgMode('dark');
    setIsSceneVisible(true);
    setBgImage(null);
    setCroppedBgImage(null);
    setSlideshowSettings(prev => ({...prev, active: false}));
  };

  const rotateCanvasX = () => setCanvasRotation(prev => [prev[0] + Math.PI / 2, prev[1], prev[2]]);
  const rotateCanvasY = () => setCanvasRotation(prev => [prev[0], prev[1] + Math.PI / 2, prev[2]]);
  const rotateCanvasZ = () => setCanvasRotation(prev => [prev[0], prev[1], prev[2] + Math.PI / 2]);

  // Arka planda gösterilecek nihai resim (Kırpılmış varsa o, yoksa orijinal)
  const displayImage = bgMode === 'image' ? (croppedBgImage || bgImage) : null;

  // Geçiş Efekti Sınıfları
  const getTransitionClass = () => {
      if (!slideshowSettings.active) return 'transition-opacity duration-700';
      
      let t = slideshowSettings.transition;
      if (t === 'random') {
          const effects = ['slide-left', 'slide-right', 'slide-up', 'slide-down', 'fade', 'blur', 'transform'];
          t = effects[Math.floor(Math.random() * effects.length)] as any;
      }

      switch (t) {
          case 'slide-left': return 'animate-slide-left';
          case 'slide-right': return 'animate-slide-right';
          case 'slide-up': return 'animate-slide-up';
          case 'slide-down': return 'animate-slide-down';
          case 'fade': return 'animate-fade-in-out';
          case 'blur': return 'animate-blur-in-out';
          case 'transform': return 'animate-transform-zoom';
          case 'particles': return 'animate-pixelate'; // CSS simülasyonu
          default: return 'transition-all duration-1000';
      }
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden" 
      onContextMenu={(e) => e.preventDefault()} 
    >
      <div className="absolute inset-0 z-0 transition-colors duration-1000 ease-in-out"
           style={{
               backgroundColor: bgMode === 'dark' ? '#000' : 
                                bgMode === 'light' ? '#fff' :
                                bgMode === 'color' ? customBgColor : 'transparent'
           }}
      >
          {displayImage && (
              // Key prop'u değiştirmek CSS animasyonunu her resim değişiminde tetikler
              <img 
                key={displayImage}
                src={displayImage} 
                alt="background" 
                className={`w-full h-full object-cover select-none pointer-events-none ${getTransitionClass()}`}
                style={{ 
                    objectFit: bgImageStyle,
                    objectPosition: 'center center',
                }}
              />
          )}

          {bgMode === 'gradient' && (
              <div className="w-full h-full bg-[linear-gradient(45deg,#ff0000,#ff7300,#fffb00,#48ff00,#00ffd5,#002bff,#7a00ff,#ff00c8,#ff0000)] bg-[length:400%_400%] animate-gradient-xy opacity-80" 
                   style={{ animation: 'gradientMove 15s ease infinite' }}
              />
          )}

          {bgMode === 'auto' && (
              <div className="w-full h-full animate-color-cycle" />
          )}
      </div>

      <style>{`
          @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
          @keyframes colorCycle { 0% { background-color: #ff0000; } 20% { background-color: #ffff00; } 40% { background-color: #00ff00; } 60% { background-color: #00ffff; } 80% { background-color: #0000ff; } 100% { background-color: #ff00ff; } }
          .animate-color-cycle { animation: colorCycle 10s infinite alternate linear; }

          /* Slayt Geçiş Animasyonları */
          @keyframes slide-left { 0% { transform: translateX(100%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
          .animate-slide-left { animation: slide-left 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

          @keyframes slide-right { 0% { transform: translateX(-100%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
          .animate-slide-right { animation: slide-right 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

          @keyframes slide-up { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
          .animate-slide-up { animation: slide-up 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

          @keyframes slide-down { 0% { transform: translateY(-100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
          .animate-slide-down { animation: slide-down 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

          @keyframes fade-in-out { 0% { opacity: 0; } 100% { opacity: 1; } }
          .animate-fade-in-out { animation: fade-in-out 1.5s ease-in-out forwards; }

          @keyframes blur-in-out { 0% { filter: blur(20px); opacity: 0; } 100% { filter: blur(0px); opacity: 1; } }
          .animate-blur-in-out { animation: blur-in-out 1.2s ease-out forwards; }

          @keyframes transform-zoom { 0% { transform: scale(1.5) rotate(5deg); opacity: 0; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
          .animate-transform-zoom { animation: transform-zoom 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

          @keyframes pixelate { 0% { filter: contrast(200%) brightness(500%) saturate(0); opacity: 0; transform: scale(1.2); } 50% { filter: contrast(100%) brightness(100%) saturate(1); opacity: 1; transform: scale(1); } 100% { opacity: 1; } }
          .animate-pixelate { animation: pixelate 1s steps(10) forwards; }
      `}</style>
      
      <ClockWidget 
        isMinimized={isWidgetMinimized} 
        onToggleMinimize={() => setIsWidgetMinimized(!isWidgetMinimized)} 
        bgMode={bgMode} 
        bgImageStyle={bgImageStyle}
        isUIHidden={isUIHidden}
      />

      <div className="absolute inset-0 z-10">
          <Experience 
            text={currentText} 
            imageXY={imageSourceXY}
            imageYZ={imageSourceYZ}
            useImageColors={useImageColors}
            particleColor={particleColor} 
            disableInteraction={isUIInteraction}
            depthIntensity={depthIntensity}
            repulsionStrength={repulsionStrength}
            repulsionRadius={repulsionRadius}
            particleCount={particleCount}
            particleSize={particleSize}
            modelDensity={modelDensity}
            activePreset={activePreset}
            audioMode={audioMode}
            audioUrl={audioUrl}
            isPlaying={isPlaying} 
            volume={volume}
            isDrawing={isDrawing}
            brushSize={brushSize}
            getDrawingDataRef={getDrawingDataRef}
            canvasRotation={canvasRotation}
            clearCanvasTrigger={clearCanvasTrigger}
            currentShape={currentShape}
            cameraResetTrigger={cameraResetTrigger} 
            isSceneVisible={isSceneVisible}
          />
      </div>
      
      <UIOverlay 
        onSubmit={handleTextSubmit} 
        onImageUpload={handleImageUpload}
        onDrawingStart={handleDrawingStart}
        onDrawingConfirm={handleDrawingConfirm}
        isDrawing={isDrawing}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        canvasRotation={canvasRotation}
        onRotateX={rotateCanvasX}
        onRotateY={rotateCanvasY}
        onRotateZ={rotateCanvasZ}
        currentColor={particleColor}
        onColorChange={handleColorChange}
        onResetColors={handleResetColors}
        isOriginalColors={useImageColors}
        onInteractionStart={() => setIsUIInteraction(true)}
        onInteractionEnd={() => setIsUIInteraction(false)}
        hasImage={!!imageSourceXY || !!imageSourceYZ}
        depthIntensity={depthIntensity}
        onDepthChange={setDepthIntensity}
        repulsionStrength={repulsionStrength}
        onRepulsionChange={setRepulsionStrength}
        repulsionRadius={repulsionRadius}
        onRadiusChange={setRepulsionRadius}
        particleCount={particleCount}
        onParticleCountChange={setParticleCount}
        particleSize={particleSize}
        onParticleSizeChange={setParticleSize}
        modelDensity={modelDensity}
        onModelDensityChange={setModelDensity}
        activePreset={activePreset}
        onPresetChange={setActivePreset}
        onAudioChange={handleAudioChange}
        audioMode={audioMode}
        audioTitle={audioTitle}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        volume={volume}
        onVolumeChange={setVolume}
        onResetAll={handleResetAll}
        onClearCanvas={handleClearCanvas}
        bgMode={bgMode}
        onBgModeChange={handleBgModeChange}
        onBgImageConfirm={(img, style) => { /* Deprecated */ }}
        customBgColor={customBgColor}
        currentShape={currentShape}
        onShapeChange={handleShapeChange}
        isWidgetMinimized={isWidgetMinimized}
        isUIHidden={isUIHidden}
        onToggleUI={() => setIsUIHidden(!isUIHidden)}
        isSceneVisible={isSceneVisible}
        onToggleScene={() => setIsSceneVisible(!isSceneVisible)}
        bgImages={bgImages}
        onBgImagesAdd={handleBgImagesAdd}
        onBgImageSelect={handleBgImageSelectFromDeck}
        onBgImageStyleChange={handleBgImageStyleChange}
        bgImageStyle={bgImageStyle}
        onRemoveBgImage={handleRemoveBgImage}
        onBgTransformChange={handleApplyCrop} 
        onResetDeck={handleDeckReset} 
        slideshowSettings={slideshowSettings}
        onSlideshowSettingsChange={setSlideshowSettings}
      />
    </div>
  );
};

export default App;