import React, { useState, useEffect, useRef } from 'react';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import { ClockWidget } from './components/ClockWidget';
import { Screensaver } from './components/Screensaver';
import { LyricsBox } from './components/LyricsBox';
import { PresetType, AudioMode, BackgroundMode, BgImageStyle, ShapeType, SlideshowSettings, LyricLine } from './types';

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

// --- WORKER KODU (String olarak) ---
// Not: Worker içinde importmap çalışmaz, bu yüzden tam CDN URL kullanıyoruz.
const WORKER_CODE = `
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0/dist/transformers.min.js';

// Skip local model checks
env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber = null;

self.addEventListener('message', async (event) => {
    const { audio, language } = event.data;

    try {
        if (!transcriber) {
            self.postMessage({ status: 'loading_model' });
            // Whisper Base modelini yükle (Daha hassas, yaklaşık 200MB)
            transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base');
            self.postMessage({ status: 'model_ready' });
        }

        self.postMessage({ status: 'transcribing' });

        // Dil ayarını belirle
        // 'auto' ise null gönderilir (model kendisi algılar)
        const targetLang = (language === 'auto' || !language) ? null : language;

        // Analizi başlat
        const output = await transcriber(audio, {
            chunk_length_s: 30,
            stride_length_s: 5,
            language: targetLang, 
            task: 'transcribe',
            return_timestamps: true,
        });

        self.postMessage({ status: 'complete', output });

    } catch (error) {
        self.postMessage({ status: 'error', error: error.message });
    }
});
`;

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
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);

  // --- Lyrics & Analysis State ---
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('Hazırlanıyor...');
  const [showLyrics, setShowLyrics] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const hiddenAudioRef = useRef<HTMLAudioElement>(null); 
  const [isModelReady, setIsModelReady] = useState(false);

  // --- Screensaver State ---
  const [ssState, setSsState] = useState<ScreensaverState>('idle');
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Screensaver Settings
  const [ssBgColor, setSsBgColor] = useState('#000000');
  const [ssTextColor, setSsTextColor] = useState('#ffffff');

  // --- Initialize Worker Function ---
  const initWorker = () => {
      // Eğer eski worker varsa öldür (hafızayı ve kuyruğu temizle)
      if (workerRef.current) {
          workerRef.current.terminate();
      }

      try {
        const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        workerRef.current = new Worker(url, { type: 'module' });
        
        workerRef.current.onmessage = (event) => {
            const { status, output, error } = event.data;
            
            if (status === 'loading_model') {
                setAnalysisStatus('Daha Güçlü Model Yükleniyor (~200MB)...');
            } else if (status === 'model_ready') {
                setIsModelReady(true);
                setAnalysisStatus('Gelişmiş Model Hazır, İşlem Başlıyor...');
            } else if (status === 'transcribing') {
                setAnalysisStatus('Sözler Yazıya Dökülüyor...');
            } else if (status === 'complete') {
                // --- AGGRESSIVE CLEANING LOGIC ---
                
                const rawChunks = output.chunks || [];
                const formattedLyrics: LyricLine[] = [];
                const rawLyrics: LyricLine[] = []; // Yedek liste

                for (const chunk of rawChunks) {
                    let text = chunk.text;
                    const originalText = text;

                    // Yedek listeye ham haliyle ekle (sadece çok kısa boşlukları temizle)
                    if(originalText.trim().length > 1) {
                         rawLyrics.push({
                            text: originalText.trim(),
                            start: chunk.timestamp[0],
                            end: chunk.timestamp[1] || chunk.timestamp[0] + 3
                        });
                    }

                    // 1. Remove Content in Brackets [] or Parentheses ()
                    text = text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');

                    // 2. Trim whitespace
                    text = text.trim();

                    // 3. Check for Empty or very short lines
                    if (text.length < 2) continue;

                    // 4. Explicit Filter for Sound Descriptions (Case Insensitive)
                    const lower = text.toLowerCase();
                    if (
                        lower === 'müzik' || lower === 'music' || 
                        lower === 'alkış' || lower === 'applause' ||
                        lower === 'sessizlik' || lower === 'silence' ||
                        lower === 'altyazı' || lower === 'subtitle' ||
                        lower === 'kuş cıvıltısı' || lower === 'rüzgar' ||
                        lower.startsWith('altyazı')
                    ) {
                        continue;
                    }

                    // 5. ANTI-HALLUCINATION: Repetition Check
                    // Kelimeleri ayır
                    const words = lower.replace(/[^a-zçğıöşü0-9 ]/g, '').split(/\s+/).filter((w: string) => w.length > 0);
                    
                    if (words.length > 5) {
                        const uniqueWords = new Set(words);
                        // Toleransı artırdım: %30'dan az unique kelime varsa sil
                        if (uniqueWords.size < words.length * 0.3) {
                            console.warn("Hallucination detected and removed:", text);
                            continue;
                        }
                    }

                    // 6. Success
                    formattedLyrics.push({
                        text: text,
                        start: chunk.timestamp[0],
                        end: chunk.timestamp[1] || chunk.timestamp[0] + 3
                    });
                }

                // Eğer sıkı filtreleme sonucu hiçbir şey kalmadıysa ama ham veride bir şeyler varsa
                if (formattedLyrics.length === 0) {
                    if (rawLyrics.length > 0) {
                        // Ham veride en azından [Müzik] olmayan bir şeyler var mı bak
                        const filteredRaw = rawLyrics.filter(l => !l.text.includes('[Müzik]') && !l.text.includes('[Music]'));
                        if (filteredRaw.length > 0) {
                            setLyrics(filteredRaw);
                        } else {
                             setLyrics([{ text: "(Sözler tamamen enstrümantal veya anlaşılamadı)", start: 0, end: 5 }]);
                        }
                    } else {
                        setLyrics([{ text: "(Söz bulunamadı)", start: 0, end: 5 }]);
                    }
                } else {
                    setLyrics(formattedLyrics);
                }
                
                setIsAnalyzing(false);
                setShowLyrics(true); 
                setIsSceneVisible(false);

            } else if (status === 'error') {
                console.error("AI Error:", error);
                setIsAnalyzing(false);
                setIsSceneVisible(true);
                alert("Analiz hatası: " + error);
            }
        };
        
        workerRef.current.onerror = (err) => {
            console.error("Worker error:", err);
            setIsAnalyzing(false);
            setIsSceneVisible(true);
        };
      } catch (e) {
        console.error("Worker creation failed:", e);
      }
  };

  useEffect(() => {
      return () => {
          if (workerRef.current) workerRef.current.terminate();
      };
  }, []);

  // --- Audio Analysis Function ---
  const analyzeAudio = async (url: string, lang: string = 'turkish') => {
      // 1. Reset UI State
      setIsAnalyzing(true);
      setShowLyrics(false);
      setLyrics([]);
      
      // 2. Restart Worker to clear any stuck state
      initWorker();
      
      setAnalysisStatus('Ses Dosyası İşleniyor...');

      try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          setAnalysisStatus('Ses Dosyası İndiriliyor...');
          
          // Basit bir fetch ile dosyayı al
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          
          setAnalysisStatus('Ses Formatı Çözümleniyor (Decode)...');
          
          // Decode audio (16kHz olması lazım Whisper için)
          const audioCtx = new AudioContext({ sampleRate: 16000 }); 
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          
          // Get channel data (Mono)
          let audioData = audioBuffer.getChannelData(0);

          setAnalysisStatus(`Yapay Zeka Analiz Ediyor (${lang === 'auto' ? 'Otomatik Dil' : lang})...`);

          // Send to worker
          if (workerRef.current) {
              workerRef.current.postMessage({
                  audio: audioData,
                  language: lang
              });
          } else {
             console.error("Worker not initialized");
             setIsAnalyzing(false);
             setIsSceneVisible(true);
          }
          
          audioCtx.close();

      } catch (e) {
          console.error("Analysis failed:", e);
          setIsAnalyzing(false);
          setIsSceneVisible(true);
          alert("Dosya işlenemedi. Lütfen geçerli bir ses dosyası olduğundan emin olun.");
      }
  };

  const cancelAnalysis = () => {
      setIsAnalyzing(false);
      setIsSceneVisible(true);
      if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
      }
  };

  // Sync Audio Time for Lyrics
  useEffect(() => {
      const audio = hiddenAudioRef.current;
      if (!audio) return;

      const updateTime = () => setAudioCurrentTime(audio.currentTime);
      const updateDuration = () => setAudioDuration(audio.duration);

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      
      return () => {
          audio.removeEventListener('timeupdate', updateTime);
          audio.removeEventListener('loadedmetadata', updateDuration);
      };
  }, [audioUrl]);

  // Audio Playback Sync (App State -> Audio Element)
  useEffect(() => {
      if (hiddenAudioRef.current) {
          hiddenAudioRef.current.volume = volume;
          if (isPlaying) hiddenAudioRef.current.play().catch(() => {});
          else hiddenAudioRef.current.pause();
      }
  }, [isPlaying, volume]);

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
                  }, 2000); // Kursor 2 saniye beklerse başla
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
    setCurrentText(text); setImageSourceXY(null); setImageSourceYZ(null); setDepthIntensity(0); setIsDrawing(false); setCanvasRotation([0, 0, 0]); setCameraResetTrigger(prev => prev + 1); setIsSceneVisible(true); setShowLyrics(false);
  };
  const handleDualImageUpload = (imgXY: string | null, imgYZ: string | null, useOriginalColors: boolean, keepRotation = false) => {
    setImageSourceXY(imgXY); setImageSourceYZ(imgYZ); setUseImageColors(useOriginalColors); setCurrentText(''); setActivePreset('none'); setIsSceneVisible(true); setShowLyrics(false);
    if (isDrawing) { setDepthIntensity(0); setIsDrawing(false); if (!keepRotation) setCanvasRotation([0, 0, 0]); } else { setDepthIntensity(0); setCanvasRotation([0, 0, 0]); }
  };
  const handleImageUpload = (imgSrc: string, useOriginalColors: boolean) => { handleDualImageUpload(imgSrc, null, useOriginalColors, false); };
  const handleDrawingStart = () => {
    setCurrentText(''); setImageSourceXY(null); setImageSourceYZ(null); setUseImageColors(false); setIsDrawing(true); setParticleColor(particleColor); setCanvasRotation([0, 0, 0]); setClearCanvasTrigger(prev => prev + 1); setIsSceneVisible(true); setShowLyrics(false);
  };
  const handleDrawingConfirm = () => {
    if (getDrawingDataRef.current) { const dataUrlXY = getDrawingDataRef.current.getXY(); const dataUrlYZ = getDrawingDataRef.current.getYZ(); handleDualImageUpload(dataUrlXY, dataUrlYZ, true, true); }
  };
  const handleColorChange = (color: string) => { setParticleColor(color); setActivePreset('none'); if ((imageSourceXY || imageSourceYZ) && !isDrawing) setUseImageColors(false); };
  const handleResetColors = () => { if (imageSourceXY || imageSourceYZ) setUseImageColors(true); };
  
  const handleAudioChange = (mode: AudioMode, url: string | null, title?: string, lang?: string) => { 
      setAudioMode(mode); 
      setAudioUrl(url); 
      setAudioTitle(title || null); 
      setIsPlaying(true);
      
      // Auto analyze if it's a file
      if (mode === 'file' && url) {
          analyzeAudio(url, lang || 'turkish');
      } else {
          setShowLyrics(false);
          setIsSceneVisible(true);
      }
  };
  
  const handleClearCanvas = () => { setClearCanvasTrigger(prev => prev + 1); };
  const handleShapeChange = (shape: ShapeType) => { setCurrentShape(shape); setCurrentText(''); setImageSourceXY(null); setImageSourceYZ(null); setUseImageColors(false); setDepthIntensity(0); setIsSceneVisible(true); setShowLyrics(false); };
  const handleResetAll = () => {
    setCurrentText(''); setParticleColor('#ffffff'); setImageSourceXY(null); setImageSourceYZ(null); setUseImageColors(false); setDepthIntensity(0); setActivePreset('none'); setAudioMode('none'); setAudioUrl(null); setAudioTitle(null); setIsPlaying(true); setRepulsionStrength(50); setRepulsionRadius(50); setParticleCount(40000); setParticleSize(20); setModelDensity(50); setIsDrawing(false); setCanvasRotation([0, 0, 0]); setCurrentShape('sphere'); setCameraResetTrigger(prev => prev + 1); setBgMode('dark'); setIsSceneVisible(true); setBgImage(null); setCroppedBgImage(null); setSlideshowSettings(prev => ({...prev, active: false})); setIsAutoRotating(false);
    setShowLyrics(false); setLyrics([]); setIsAnalyzing(false);
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

  let appDuration = '0.25s';
  let ssDuration = '0.25s';
  let appFilter = 'blur(0px) brightness(1)';
  let appTransform = 'scale(1)';
  let appInset = '0px';
  let appRadius = '0px';

  let ssTransform = 'translateY(100%)'; 
  let ssInset = '20px';
  let ssBlur = 'blur(10px)';
  let ssOpacity = '0'; 
  let ssPointer = 'none';
  let ssRadius = '30px';
  let ssScale = '0.95';

  switch (ssState) {
      case 'idle':
          break;
      case 'e1_app_blur':
          appDuration = '0.25s'; appFilter = 'blur(0px) brightness(1)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)';
          break;
      case 'e2_app_shrink':
          appDuration = '0.25s'; appFilter = 'blur(10px) brightness(0.7)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)';
          ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(100%)'; ssBlur = 'blur(10px)';
          break;
      case 'e3_ss_slide_up':
          appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)';
          ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(0)'; ssInset = '20px'; ssBlur = 'blur(10px)'; ssRadius = '30px'; ssScale = '0.95';
          break;
      case 'e4_ss_unblur':
          appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)';
          ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(0)'; ssBlur = 'blur(0px)'; ssInset = '20px'; ssRadius = '30px'; ssScale = '0.95';
          break;
      case 'e5_ss_expand':
          appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)';
          ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(0)'; ssBlur = 'blur(0px)'; ssInset = '0px'; ssRadius = '0px'; ssScale = '1';
          break;
      case 'active':
          appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)';
          ssOpacity = '1'; ssPointer = 'auto'; ssTransform = 'translateY(0)'; ssBlur = 'blur(0px)'; ssInset = '0px'; ssRadius = '0px'; ssScale = '1';
          break;
      case 'x1_ss_shrink':
          appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)';
          ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(0)'; ssBlur = 'blur(0px)'; ssInset = '20px'; ssRadius = '30px'; ssScale = '0.95';
          break;
      case 'x2_ss_blur':
          appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)';
          ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(0)'; ssBlur = 'blur(10px)'; ssInset = '20px'; ssRadius = '30px'; ssScale = '0.95';
          break;
      case 'x3_ss_slide_down':
          appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)';
          ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(100%)'; ssBlur = 'blur(10px)'; ssInset = '20px'; ssRadius = '30px'; ssScale = '0.95';
          break;
      case 'x4_app_expand':
          ssOpacity = '1'; ssTransform = 'translateY(100%)';
          appDuration = '0.25s'; appFilter = 'blur(10px) brightness(0.7)'; appInset = '0px'; appRadius = '0px'; appTransform = 'scale(1)';
          break;
      case 'x5_app_unblur':
          ssOpacity = '0'; ssDuration = '0.25s';
          appDuration = '0.25s'; appFilter = 'blur(0px) brightness(1)'; appInset = '0px'; appRadius = '0px'; appTransform = 'scale(1)';
          break;
  }

  const appLayerStyle: React.CSSProperties = {
      transition: `all ${appDuration} cubic-bezier(0.4, 0, 0.2, 1)`,
      position: 'absolute',
      overflow: 'hidden',
      zIndex: 0,
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
      opacity: ssOpacity,
      pointerEvents: ssPointer as any,
      transform: ssTransform.includes('translate') ? `${ssTransform} scale(${ssScale})` : ssTransform,
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

      {/* Hidden Audio for Playback */}
      {audioUrl && (
          <audio ref={hiddenAudioRef} src={audioUrl} loop hidden crossOrigin="anonymous" />
      )}

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

            {/* Analysis Loading Screen */}
            {isAnalyzing && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_#3b82f6]"></div>
                    <div className="text-white font-mono text-xl animate-pulse tracking-widest text-center px-4">{analysisStatus}</div>
                    <div className="text-white/50 text-xs mt-2 font-mono">Lütfen Bekleyin</div>
                    <button 
                        onClick={cancelAnalysis}
                        className="mt-6 px-4 py-2 border border-red-500/50 text-red-300 rounded hover:bg-red-500/10 transition-colors text-xs font-mono tracking-wider"
                    >
                        ANALİZİ İPTAL ET
                    </button>
                </div>
            )}

            {/* Lyrics Display */}
            {showLyrics && (
                <LyricsBox 
                    lyrics={lyrics}
                    currentTime={audioCurrentTime}
                    duration={audioDuration}
                    audioRef={hiddenAudioRef}
                    visible={showLyrics}
                />
            )}

            <div className={`absolute inset-0 z-10 transition-all duration-1000 ${isSceneVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none blur-sm'}`}>
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
                  audioRef={hiddenAudioRef} // PASSING REF HERE
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
                  isAutoRotating={isAutoRotating} 
                  onStopAutoRotation={() => setIsAutoRotating(false)} 
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
              onBgImageConfirm={(img, style) => {}} 
              customBgColor={customBgColor} 
              currentShape={currentShape} 
              onShapeChange={handleShapeChange} 
              isWidgetMinimized={isWidgetMinimized} 
              isUIHidden={isUIHidden} 
              onToggleUI={() => setIsUIHidden(!isUIHidden)} 
              isSceneVisible={isSceneVisible} 
              onToggleScene={() => { setIsSceneVisible(!isSceneVisible); if(lyrics.length > 0 && !isSceneVisible) setShowLyrics(true); else setShowLyrics(false); }} 
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
              isAutoRotating={isAutoRotating} 
              onToggleAutoRotation={() => setIsAutoRotating(!isAutoRotating)} 
            />
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