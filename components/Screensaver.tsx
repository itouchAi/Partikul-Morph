import React, { useState, useEffect } from 'react';

interface ScreensaverProps {
  active: boolean;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
  bgColor?: string;
  textColor?: string;
}

export const Screensaver: React.FC<ScreensaverProps> = ({ 
  active, 
  onClick, 
  className, 
  style,
  bgColor = '#000000',
  textColor = '#ffffff'
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [active]);

  const formatTime = (date: Date) => date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (date: Date) => date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

  return (
    <div 
      className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer overflow-hidden select-none z-[100] ${className || ''}`}
      style={{
          ...style,
          backgroundColor: bgColor,
          color: textColor
      }}
      onClick={onClick}
    >
      <div className="text-center font-mono">
        <div className="text-[15vw] leading-none font-bold tracking-tighter opacity-90" style={{ textShadow: `0 0 30px ${textColor}50` }}>
          {formatTime(time)}
        </div>
        <div className="text-[3vw] font-light opacity-60 mt-4 tracking-widest uppercase">
          {formatDate(time)}
        </div>
      </div>
      
      <div className="absolute bottom-10 text-sm animate-pulse opacity-50">
        Ekranı açmak için tıklayın
      </div>
    </div>
  );
};