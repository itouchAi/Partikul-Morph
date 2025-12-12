import React, { useState, useEffect, useRef } from 'react';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import { ClockWidget } from './components/ClockWidget';
import { PresetType, AudioMode, BackgroundMode, BgImageStyle, ShapeType } from './types';

const App: React.FC = () => {
  const [currentText, setCurrentText] = useState<string>('');
  const [particleColor, setParticleColor] = useState<string>('#ffffff');
  
  // Arka Plan State'leri
  const [bgMode, setBgMode] = useState<BackgroundMode>('dark');
  const [customBgColor, setCustomBgColor] = useState<string>('#000000');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgImageStyle, setBgImageStyle] = useState<BgImageStyle>('cover');

  // Widget State
  const [isWidgetMinimized, setIsWidgetMinimized] = useState<boolean>(false);

  // UI Gizleme (Clean Mode) State'i
  const [isUIHidden, setIsUIHidden] = useState<boolean>(false);

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

  // Ayarlar
  const [repulsionStrength, setRepulsionStrength] = useState<number>(50);
  const [repulsionRadius, setRepulsionRadius] = useState<number>(50);
  const [particleCount, setParticleCount] = useState<number>(40000); 
  
  const [particleSize, setParticleSize] = useState<number>(20); 
  const [modelDensity, setModelDensity] = useState<number>(50); 

  const [isUIInteraction, setIsUIInteraction] = useState<boolean>(false);

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
      }
      if (mode === 'color' && extraData) {
          setCustomBgColor(extraData);
      }
  };

  const handleBgImageConfirm = (img: string, style: BgImageStyle) => {
      setBgImage(img);
      setBgImageStyle(style);
      setBgMode('image');
  };

  const handleTextSubmit = (text: string) => {
    setCurrentText(text);
    setImageSourceXY(null);
    setImageSourceYZ(null);
    setDepthIntensity(0);
    setIsDrawing(false);
    setCanvasRotation([0, 0, 0]);
    setCameraResetTrigger(prev => prev + 1);
  };

  const handleDualImageUpload = (imgXY: string | null, imgYZ: string | null, useOriginalColors: boolean, keepRotation = false) => {
    setImageSourceXY(imgXY);
    setImageSourceYZ(imgYZ);
    setUseImageColors(useOriginalColors);
    setCurrentText('');
    setActivePreset('none');
    
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
    setIsPlaying(true); // Yeni müzik yüklendiğinde otomatik başlat
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
  };

  const rotateCanvasX = () => setCanvasRotation(prev => [prev[0] + Math.PI / 2, prev[1], prev[2]]);
  const rotateCanvasY = () => setCanvasRotation(prev => [prev[0], prev[1] + Math.PI / 2, prev[2]]);
  const rotateCanvasZ = () => setCanvasRotation(prev => [prev[0], prev[1], prev[2] + Math.PI / 2]);

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
          {bgMode === 'image' && bgImage && (
              <img 
                src={bgImage} 
                alt="background" 
                className="w-full h-full opacity-100 transition-opacity duration-500"
                style={{ objectFit: bgImageStyle }}
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
            isDrawing={isDrawing}
            brushSize={brushSize}
            getDrawingDataRef={getDrawingDataRef}
            canvasRotation={canvasRotation}
            clearCanvasTrigger={clearCanvasTrigger}
            currentShape={currentShape}
            cameraResetTrigger={cameraResetTrigger} 
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
        onResetAll={handleResetAll}
        onClearCanvas={handleClearCanvas}
        bgMode={bgMode}
        onBgModeChange={handleBgModeChange}
        onBgImageConfirm={handleBgImageConfirm}
        customBgColor={customBgColor}
        currentShape={currentShape}
        onShapeChange={handleShapeChange}
        isWidgetMinimized={isWidgetMinimized}
        isUIHidden={isUIHidden}
        onToggleUI={() => setIsUIHidden(!isUIHidden)}
      />
    </div>
  );
};

export default App;