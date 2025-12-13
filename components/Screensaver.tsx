import React, { useState, useEffect, useMemo } from 'react';

interface ScreensaverProps {
  active: boolean;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
  bgColor?: string;
  textColor?: string;
}

// 7-Segment Haritası (0-9)
// A: Üst, B: Sağ Üst, C: Sağ Alt, D: Alt, E: Sol Alt, F: Sol Üst, G: Orta
const DIGIT_MAP: Record<number, string[]> = {
    0: ['A', 'B', 'C', 'D', 'E', 'F'],
    1: ['B', 'C'],
    2: ['A', 'B', 'D', 'E', 'G'],
    3: ['A', 'B', 'C', 'D', 'G'],
    4: ['B', 'C', 'F', 'G'],
    5: ['A', 'C', 'D', 'F', 'G'],
    6: ['A', 'C', 'D', 'E', 'F', 'G'],
    7: ['A', 'B', 'C'],
    8: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    9: ['A', 'B', 'C', 'D', 'F', 'G'],
};

// Segment Pozisyonlama Stilleri
const SEGMENT_STYLES: Record<string, React.CSSProperties> = {
    A: { top: 0, left: '10%', right: '10%', height: '15%' }, // Üst Yatay
    B: { top: '10%', right: 0, height: '40%', width: '15%' }, // Sağ Üst Dikey
    C: { bottom: '10%', right: 0, height: '40%', width: '15%' }, // Sağ Alt Dikey
    D: { bottom: 0, left: '10%', right: '10%', height: '15%' }, // Alt Yatay
    E: { bottom: '10%', left: 0, height: '40%', width: '15%' }, // Sol Alt Dikey
    F: { top: '10%', left: 0, height: '40%', width: '15%' }, // Sol Üst Dikey
    G: { top: '42.5%', left: '10%', right: '10%', height: '15%' }, // Orta Yatay
};

const Segment: React.FC<{ 
    id: string; 
    active: boolean; 
    color: string; 
    bgColor: string; 
}> = ({ id, active, color, bgColor }) => {
    
    // Parçanın şekli (Dikey veya Yatay için köşe yuvarlatma)
    const isVertical = ['B', 'C', 'E', 'F'].includes(id);
    const borderRadius = isVertical ? '4px' : '4px';

    return (
        <div 
            className="absolute perspective-500"
            style={{ 
                ...SEGMENT_STYLES[id], 
                zIndex: 10
            }}
        >
            <div 
                className="relative w-full h-full transition-transform duration-700 ease-in-out transform-style-3d"
                style={{
                    transform: active ? 'rotateX(0deg)' : 'rotateX(180deg)'
                }}
            >
                {/* ÖN YÜZ (AKTİF - Kabartmalı) */}
                <div 
                    className="absolute inset-0 backface-hidden flex items-center justify-center"
                    style={{
                        backgroundColor: color,
                        borderRadius: borderRadius,
                        // Kabartma Efekti: Sağ-Alt gölge, Sol-Üst parlaklık
                        boxShadow: `
                            4px 4px 8px rgba(0,0,0,0.5), 
                            inset 1px 1px 2px rgba(255,255,255,0.4),
                            inset -1px -1px 2px rgba(0,0,0,0.2)
                        `
                    }}
                >
                    {/* Hafif doku efekti */}
                    <div className="w-full h-full opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.5)_25%,rgba(0,0,0,0.5)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.5)_75%,rgba(0,0,0,0.5)_100%)] bg-[length:4px_4px]" />
                </div>

                {/* ARKA YÜZ (PASİF - Arka Planla Uyumlu) */}
                <div 
                    className="absolute inset-0 backface-hidden"
                    style={{
                        backgroundColor: bgColor,
                        borderRadius: borderRadius,
                        transform: 'rotateX(180deg)',
                        // Gömülme hissi için hafif iç gölge
                        boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}
                />
            </div>
        </div>
    );
};

const Digit: React.FC<{ value: number; color: string; bgColor: string }> = ({ value, color, bgColor }) => {
    const activeSegments = DIGIT_MAP[value] || [];

    return (
        <div className="relative w-[12vw] h-[20vw] max-w-[120px] max-h-[200px] mx-2">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((seg) => (
                <Segment 
                    key={seg} 
                    id={seg} 
                    active={activeSegments.includes(seg)} 
                    color={color} 
                    bgColor={bgColor} 
                />
            ))}
        </div>
    );
};

export const Screensaver: React.FC<ScreensaverProps> = ({ 
  active, 
  onClick, 
  className, 
  style,
  bgColor = '#111111',
  textColor = '#ff0000'
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [active]);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const h1 = Math.floor(hours / 10);
  const h2 = hours % 10;
  const m1 = Math.floor(minutes / 10);
  const m2 = minutes % 10;
  const s1 = Math.floor(seconds / 10);
  const s2 = seconds % 10;

  // Arka Plan Deseni (Grid 8'ler)
  // Bu SVG, sönük bir 8 rakamını temsil eder ve tüm ekranı kaplar.
  const bgPattern = useMemo(() => {
      // SVG encoded as Data URI
      const stroke = encodeURIComponent(textColor); 
      // Opacity düşük tutularak arka plan dokusu oluşturulur
      return `data:image/svg+xml,%3Csvg width='40' height='70' viewBox='0 0 40 70' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='${stroke}' stroke-opacity='0.05' stroke-width='2'%3E%3Cpath d='M5 5 h30 l-5 30 h-20 z' /%3E%3Cpath d='M5 35 h30 l-5 30 h-20 z' /%3E%3C/g%3E%3C/svg%3E`;
  }, [textColor]);

  return (
    <div 
      className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer overflow-hidden select-none z-[100] ${className || ''}`}
      style={{
          ...style,
          backgroundColor: bgColor,
      }}
      onClick={onClick}
    >
      <style>{`
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .perspective-500 { perspective: 500px; }
      `}</style>

      {/* ARKA PLAN DOKUSU (Saç Örgüsü / Grid Gibi) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
            backgroundImage: `url("${bgPattern}")`,
            backgroundSize: '40px 70px', // Küçük digitler
            backgroundPosition: 'center'
        }}
      />
      
      {/* Vinyet Efekti */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

      {/* SAAT KONTEYNERİ */}
      <div className="relative z-10 flex items-center gap-4 p-10 rounded-3xl backdrop-blur-sm bg-black/20 shadow-2xl border border-white/5">
         
         {/* SAAT */}
         <div className="flex gap-1">
             <Digit value={h1} color={textColor} bgColor={bgColor} />
             <Digit value={h2} color={textColor} bgColor={bgColor} />
         </div>

         {/* AYIRAÇ (Noktalar) */}
         <div className="flex flex-col gap-8 mx-2 opacity-80 animate-pulse">
             <div className="w-4 h-4 rounded-full" style={{ backgroundColor: textColor, boxShadow: '2px 2px 4px rgba(0,0,0,0.5)' }} />
             <div className="w-4 h-4 rounded-full" style={{ backgroundColor: textColor, boxShadow: '2px 2px 4px rgba(0,0,0,0.5)' }} />
         </div>

         {/* DAKİKA */}
         <div className="flex gap-1">
             <Digit value={m1} color={textColor} bgColor={bgColor} />
             <Digit value={m2} color={textColor} bgColor={bgColor} />
         </div>

         {/* AYIRAÇ */}
         <div className="flex flex-col gap-8 mx-2 opacity-80 animate-pulse">
             <div className="w-4 h-4 rounded-full" style={{ backgroundColor: textColor, boxShadow: '2px 2px 4px rgba(0,0,0,0.5)' }} />
             <div className="w-4 h-4 rounded-full" style={{ backgroundColor: textColor, boxShadow: '2px 2px 4px rgba(0,0,0,0.5)' }} />
         </div>

         {/* SANİYE (Daha Küçük) */}
         <div className="flex gap-1 scale-75 origin-left">
             <Digit value={s1} color={textColor} bgColor={bgColor} />
             <Digit value={s2} color={textColor} bgColor={bgColor} />
         </div>

      </div>
      
      <div className="absolute bottom-10 text-sm animate-pulse opacity-40 font-mono tracking-widest" style={{ color: textColor }}>
        SİSTEM KİLİTLİ
      </div>
    </div>
  );
};
