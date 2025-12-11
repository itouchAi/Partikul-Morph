import React, { useState, useEffect, useRef } from 'react';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import * as THREE from 'three';

export type PresetType = 'none' | 'electric' | 'fire' | 'water' | 'mercury' | 'disco';
export type AudioMode = 'none' | 'file' | 'mic';

const App: React.FC = () => {
  const [currentText, setCurrentText] = useState<string>('');
  const [particleColor, setParticleColor] = useState<string>('#ffffff');
  
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
  const getDrawingDataRef = useRef<{ getXY: () => string, getYZ: () => string } | null>(null);

  // Efekt Presets
  const [activePreset, setActivePreset] = useState<PresetType>('none');

  // Ses Ayarları
  const [audioMode, setAudioMode] = useState<AudioMode>('none');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Ayarlar
  const [repulsionStrength, setRepulsionStrength] = useState<number>(50);
  const [repulsionRadius, setRepulsionRadius] = useState<number>(50);
  const [particleCount, setParticleCount] = useState<number>(40000); 
  
  // İsimlendirme Değişikliği ve Yeni Özellik
  const [particleSize, setParticleSize] = useState<number>(20); // Eski particleSpacing -> particleSize
  const [modelDensity, setModelDensity] = useState<number>(50); // Yeni: Model Sıkılığı

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

  const handleTextSubmit = (text: string) => {
    setCurrentText(text);
    setImageSourceXY(null);
    setImageSourceYZ(null);
    setDepthIntensity(0);
    setIsDrawing(false);
    setCanvasRotation([0, 0, 0]); 
  };

  const handleDualImageUpload = (imgXY: string | null, imgYZ: string | null, useOriginalColors: boolean, keepRotation = false) => {
    setImageSourceXY(imgXY);
    setImageSourceYZ(imgYZ);
    setUseImageColors(useOriginalColors);
    setCurrentText('');
    
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

  const handleAudioChange = (mode: AudioMode, url: string | null) => {
    setAudioMode(mode);
    setAudioUrl(url);
  };

  const handleClearCanvas = () => {
      setClearCanvasTrigger(prev => prev + 1);
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
    setRepulsionStrength(50);
    setRepulsionRadius(50);
    setParticleCount(40000);
    setParticleSize(20);
    setModelDensity(50);
    setIsDrawing(false);
    setCanvasRotation([0, 0, 0]);
  };

  const rotateCanvasX = () => setCanvasRotation(prev => [prev[0] + Math.PI / 2, prev[1], prev[2]]);
  const rotateCanvasY = () => setCanvasRotation(prev => [prev[0], prev[1] + Math.PI / 2, prev[2]]);
  const rotateCanvasZ = () => setCanvasRotation(prev => [prev[0], prev[1], prev[2] + Math.PI / 2]);

  return (
    <div 
      className="relative w-full h-full bg-black" 
      onContextMenu={(e) => e.preventDefault()} 
    >
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
        isDrawing={isDrawing}
        brushSize={brushSize}
        getDrawingDataRef={getDrawingDataRef}
        canvasRotation={canvasRotation}
        clearCanvasTrigger={clearCanvasTrigger}
      />
      
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
        onResetAll={handleResetAll}
        onClearCanvas={handleClearCanvas}
      />
    </div>
  );
};

export default App;