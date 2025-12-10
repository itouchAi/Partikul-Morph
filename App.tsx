import React, { useState, useEffect } from 'react';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';

export type PresetType = 'none' | 'electric' | 'fire' | 'water' | 'mercury';

const App: React.FC = () => {
  const [currentText, setCurrentText] = useState<string>('');
  const [particleColor, setParticleColor] = useState<string>('#ffffff');
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [useImageColors, setUseImageColors] = useState<boolean>(false);
  const [depthIntensity, setDepthIntensity] = useState<number>(0); 
  
  // Efekt Presets
  const [activePreset, setActivePreset] = useState<PresetType>('none');

  // Ayarlar
  const [repulsionStrength, setRepulsionStrength] = useState<number>(50);
  const [repulsionRadius, setRepulsionRadius] = useState<number>(50);
  const [particleCount, setParticleCount] = useState<number>(30000);
  const [particleSpacing, setParticleSpacing] = useState<number>(0);

  const [isUIInteraction, setIsUIInteraction] = useState<boolean>(false);

  // ESC Tuşu ile Efekti İptal Etme
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePreset('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTextSubmit = (text: string) => {
    setCurrentText(text);
    setImageSource(null);
    setDepthIntensity(0);
  };

  const handleImageUpload = (imgSrc: string, useOriginalColors: boolean) => {
    setImageSource(imgSrc);
    setUseImageColors(useOriginalColors);
    setCurrentText('');
    setDepthIntensity(0); 
  };

  const handleColorChange = (color: string) => {
    setParticleColor(color);
    if (imageSource) {
      setUseImageColors(false);
    }
  };

  const handleResetColors = () => {
    if (imageSource) {
      setUseImageColors(true);
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* 3D Sahne */}
      <Experience 
        text={currentText} 
        image={imageSource}
        useImageColors={useImageColors}
        particleColor={particleColor} 
        disableInteraction={isUIInteraction}
        depthIntensity={depthIntensity}
        repulsionStrength={repulsionStrength}
        repulsionRadius={repulsionRadius}
        particleCount={particleCount}
        particleSpacing={particleSpacing}
        activePreset={activePreset}
      />
      
      {/* Kullanıcı Arayüzü */}
      <UIOverlay 
        onSubmit={handleTextSubmit} 
        onImageUpload={handleImageUpload}
        currentColor={particleColor}
        onColorChange={handleColorChange}
        onResetColors={handleResetColors}
        isOriginalColors={useImageColors}
        onInteractionStart={() => setIsUIInteraction(true)}
        onInteractionEnd={() => setIsUIInteraction(false)}
        hasImage={!!imageSource}
        depthIntensity={depthIntensity}
        onDepthChange={setDepthIntensity}
        repulsionStrength={repulsionStrength}
        onRepulsionChange={setRepulsionStrength}
        repulsionRadius={repulsionRadius}
        onRadiusChange={setRepulsionRadius}
        particleCount={particleCount}
        onParticleCountChange={setParticleCount}
        particleSpacing={particleSpacing}
        onSpacingChange={setParticleSpacing}
        activePreset={activePreset}
        onPresetChange={setActivePreset}
      />
    </div>
  );
};

export default App;