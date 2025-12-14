import React, { useState, useEffect, useRef } from 'react';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import { ClockWidget } from './components/ClockWidget';
import { Screensaver } from './components/Screensaver';
import { LyricsBox } from './components/LyricsBox';
import { PresetType, AudioMode, BackgroundMode, BgImageStyle, ShapeType, SlideshowSettings, LyricLine, SlideshowTransition } from './types';

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
  const [widgetUserText, setWidgetUserText] = useState<string>('');
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
  // Fix: Rastgele geçiş için kararlı state (Strobe effect prevention)
  const [activeTransitionClass, setActiveTransitionClass] = useState('transition-opacity duration-700');
  
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
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [showLyrics, setShowLyrics] = useState(false); // DOM Overlay Lyrics
  const [useLyricParticles, setUseLyricParticles] = useState(false); // 3D Particle Lyrics
  const [useLyricEcho, setUseLyricEcho] = useState(false); // Eko (Audio Reactivity) Toggle
  const [activeLyricText, setActiveLyricText] = useState<string>(''); // Currently sung line
  
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const hiddenAudioRef = useRef<HTMLAudioElement>(null); 
  const [isModelReady, setIsModelReady] = useState(false);
  
  // NEW: Robust ID Tracking & Versioning
  const analysisIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [audioVersion, setAudioVersion] = useState(0); // Bu değiştiğinde Player yeniden doğar

  // --- Audio Engine State (Centralized) ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);

  // --- Screensaver State ---
  const [ssState, setSsState] = useState<ScreensaverState>('idle');
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ssBgColor, setSsBgColor] = useState('#000000');
  const [ssTextColor, setSsTextColor] = useState('#ffffff');

  // --- Initialize Worker Function ---
  const initWorker = () => {
      if (workerRef.current) return; 

      try {
        const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        workerRef.current = new Worker(url, { type: 'module' });
        workerRef.current.onmessage = (event) => {
            const { status, output, error } = event.data;
            if (status === 'loading_model') setAnalysisStatus('AI Yükleniyor...');
            else if (status === 'model_ready') { setIsModelReady(true); setAnalysisStatus('Analiz Başlıyor...'); }
            else if (status === 'transcribing') setAnalysisStatus('Sözler Çıkarılıyor...');
            else if (status === 'complete') {
                const rawChunks = output.chunks || [];
                const formattedLyrics: LyricLine[] = [];
                const rawLyrics: LyricLine[] = [];
                for (const chunk of rawChunks) {
                    let text = chunk.text;
                    if(text.trim().length > 1) {
                         rawLyrics.push({ text: text.trim(), start: chunk.timestamp[0], end: chunk.timestamp[1] || chunk.timestamp[0] + 3 });
                    }
                    text = text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
                    if (text.length < 2) continue;
                    const lower = text.toLowerCase();
                    if (lower === 'müzik' || lower === 'music' || lower === 'alkış' || lower === 'applause' || lower === 'sessizlik' || lower === 'silence' || lower.startsWith('altyazı')) continue;
                    const words = lower.replace(/[^a-zçğıöşü0-9 ]/g, '').split(/\s+/).filter((w: string) => w.length > 0);
                    if (words.length > 5) {
                        const uniqueWords = new Set(words);
                        if (uniqueWords.size < words.length * 0.3) { console.warn("Hallucination detected:", text); continue; }
                    }
                    formattedLyrics.push({ text: text, start: chunk.timestamp[0], end: chunk.timestamp[1] || chunk.timestamp[0] + 3 });
                }
                if (formattedLyrics.length === 0) {
                    if (rawLyrics.length > 0) {
                        const filteredRaw = rawLyrics.filter(l => !l.text.includes('[Müzik]') && !l.text.includes('[Music]'));
                        setLyrics(filteredRaw.length > 0 ? filteredRaw : [{ text: "...", start: 0, end: 5 }]);
                    } else setLyrics([{ text: "...", start: 0, end: 5 }]);
                } else setLyrics(formattedLyrics);
                
                setIsAnalyzing(false); 
                // Otomatik olarak partikül sözleri aç
                setUseLyricParticles(true);
            } else if (status === 'error') {
                console.error("AI Error:", error); setIsAnalyzing(false); 
            }
        };
      } catch (e) { console.error("Worker creation failed:", e); }
  };

  useEffect(() => { return () => { if (workerRef.current) workerRef.current.terminate(); }; }, []);

  // --- Audio Analysis Function (Isolated) ---
  const analyzeAudio = async (url: string, lang: string = 'turkish', analysisId: number) => {
      if (analysisId !== analysisIdRef.current) return;

      setIsAnalyzing(true); 
      initWorker();
      setAnalysisStatus('Ses İndiriliyor...');
      
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
          // Fetch separately from playback
          const response = await fetch(url, { signal: abortController.signal });
          const arrayBuffer = await response.arrayBuffer();
          
          if (analysisId !== analysisIdRef.current) return;

          setAnalysisStatus('İşleniyor...');
          // Use a completely separate context for decoding to avoid locking the main one
          const offlineCtx = new AudioContext({ sampleRate: 16000 }); 
          
          try {
              const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
              
              if (analysisId !== analysisIdRef.current) return;

              let audioData = audioBuffer.getChannelData(0);
              setAnalysisStatus('Yapay Zeka Dinliyor...');
              
              if (workerRef.current) {
                  workerRef.current.postMessage({ audio: audioData, language: lang });
              }
          } finally {
              offlineCtx.close();
          }
      } catch (e: any) {
          if (e.name !== 'AbortError' && analysisId === analysisIdRef.current) {
              console.error("Analysis failed:", e); 
              setIsAnalyzing(false); 
              setAnalysisStatus('Hata');
          }
      }
  };

  // --- Centralized Audio Context Management ---
  // Re-run whenever audioVersion changes (new song)
  useEffect(() => {
      if (audioMode === 'none') {
          if (audioContextRef.current) {
              audioContextRef.current.suspend();
          }
          return;
      }

      const initAudioContext = async () => {
          if (!audioContextRef.current) {
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              audioContextRef.current = new AudioContextClass();
              
              const analyser = audioContextRef.current.createAnalyser();
              analyser.fftSize = 256;
              analyser.smoothingTimeConstant = 0.5;
              analyserRef.current = analyser;
          }

          const ctx = audioContextRef.current;
          const analyser = analyserRef.current;

          if (!ctx || !analyser) return;

          if (ctx.state === 'suspended') {
              await ctx.resume();
          }

          // Clean up old connections
          if (sourceNodeRef.current) {
              sourceNodeRef.current.disconnect();
              sourceNodeRef.current = null;
          }

          // Wait for DOM update
          setTimeout(() => {
              if (audioMode === 'file' && hiddenAudioRef.current) {
                  try {
                      const source = ctx.createMediaElementSource(hiddenAudioRef.current);
                      source.connect(analyser);
                      analyser.connect(ctx.destination); 
                      sourceNodeRef.current = source;
                  } catch (e) {
                      // Already connected error is fine here since we destroy the element
                  }
              } else if (audioMode === 'mic') {
                  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                      const source = ctx.createMediaStreamSource(stream);
                      source.connect(analyser);
                      sourceNodeRef.current = source;
                  }).catch(e => console.error("Mic error", e));
              }
          }, 100);
      };

      initAudioContext();
  }, [audioMode, audioVersion]);

  // Sync Audio Time for Lyrics
  useEffect(() => {
      const audio = hiddenAudioRef.current;
      if (!audio) return;

      const updateTime = () => {
          const t = audio.currentTime;
          setAudioCurrentTime(t);
          
          if (lyrics.length > 0) {
              const activeLine = lyrics.find(l => t >= l.start && t < l.end);
              if (activeLine) {
                  setActiveLyricText(activeLine.text);
              }
          }
      };
      const updateDuration = () => setAudioDuration(audio.duration);
      
      // Events need to be re-attached because the element is new
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      
      return () => { 
          audio.removeEventListener('timeupdate', updateTime); 
          audio.removeEventListener('loadedmetadata', updateDuration); 
      };
  }, [audioVersion, lyrics]);

  // --- PLAYBACK CONTROL ---
  useEffect(() => {
      const audio = hiddenAudioRef.current;
      if (!audio) return;

      const playAudio = async () => {
          audio.volume = volume;
          if (isPlaying && audioUrl) {
              try {
                  await audio.play();
              } catch (e) {
                  console.warn("Autoplay prevented", e);
              }
          } else {
              audio.pause();
          }
      };
      
      // Small delay to ensure DOM is ready after remount
      const t = setTimeout(playAudio, 100);
      return () => clearTimeout(t);
  }, [isPlaying, volume, audioVersion, audioUrl]);


  // --- Slayt Gösterisi ve Transition Mantığı ---
  useEffect(() => {
      let intervalId: any;

      const getTransitionClassString = (t: SlideshowTransition) => {
          switch (t) {
              case 'slide-left': return 'animate-slide-left';
              case 'slide-right': return 'animate-slide-right';
              case 'slide-up': return 'animate-slide-up';
              case 'slide-down': return 'animate-slide-down';
              case 'fade': return 'animate-fade-in-out';
              case 'blur': return 'animate-blur-in-out';
              case 'transform': return 'animate-transform-zoom';
              case 'particles': return 'animate-pixelate';
              default: return 'transition-all duration-1000';
          }
      };

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

              let nextT = slideshowSettings.transition;
              if (nextT === 'random') {
                  const effects = ['slide-left', 'slide-right', 'slide-up', 'slide-down', 'fade', 'blur', 'transform'];
                  nextT = effects[Math.floor(Math.random() * effects.length)] as any;
              }
              setActiveTransitionClass(getTransitionClassString(nextT));

          }, Math.max(3000, slideshowSettings.duration * 1000));
      }
      return () => { if (intervalId) clearInterval(intervalId); };
  }, [slideshowSettings, bgImages.length, bgMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setActivePreset('none'); if (isDrawing) setIsDrawing(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing]);

  // --- EKRAN KORUYUCU ---
  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (ssState !== 'idle') return;
          if (e.clientY <= 10 || e.clientY >= window.innerHeight - 10) {
              if (!hoverTimerRef.current) hoverTimerRef.current = setTimeout(() => setSsState('e1_app_blur'), 2000);
          } else { if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; } }
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => { window.removeEventListener('mousemove', handleMouseMove); if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); };
  }, [ssState]); 

  useEffect(() => {
      let timer: ReturnType<typeof setTimeout>;
      if (ssState === 'e1_app_blur') timer = setTimeout(() => setSsState('e2_app_shrink'), 300);
      else if (ssState === 'e2_app_shrink') timer = setTimeout(() => setSsState('e3_ss_slide_up'), 300);
      else if (ssState === 'e3_ss_slide_up') timer = setTimeout(() => setSsState('e4_ss_unblur'), 300);
      else if (ssState === 'e4_ss_unblur') timer = setTimeout(() => setSsState('e5_ss_expand'), 300);
      else if (ssState === 'e5_ss_expand') timer = setTimeout(() => setSsState('active'), 300);
      else if (ssState === 'x1_ss_shrink') timer = setTimeout(() => setSsState('x2_ss_blur'), 300);
      else if (ssState === 'x2_ss_blur') timer = setTimeout(() => setSsState('x3_ss_slide_down'), 300);
      else if (ssState === 'x3_ss_slide_down') timer = setTimeout(() => setSsState('x4_app_expand'), 300);
      else if (ssState === 'x4_app_expand') timer = setTimeout(() => setSsState('x5_app_unblur'), 300);
      else if (ssState === 'x5_app_unblur') timer = setTimeout(() => setSsState('idle'), 300);
      return () => { if (timer) clearTimeout(timer); };
  }, [ssState]);

  const handleScreensaverClick = () => { if (ssState === 'active') setSsState('x1_ss_shrink'); };

  // Handlers
  const handleBgModeChange = (mode: BackgroundMode, extraData?: string) => {
      setBgMode(mode);
      if (mode === 'light') { setParticleColor('#000000'); setUseImageColors(false); } else if (mode === 'dark') setParticleColor('#ffffff');
      if (mode === 'image' && extraData) { setBgImage(extraData); setCroppedBgImage(null); }
      if (mode === 'color' && extraData) setCustomBgColor(extraData);
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
      // 1. New Version ID -> Kills old player
      const newAnalysisId = analysisIdRef.current + 1;
      analysisIdRef.current = newAnalysisId;

      // 2. Kill old analysis
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
      }
      if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
      }

      // 3. Reset UI
      setIsAnalyzing(false); 
      setAnalysisStatus('');
      setLyrics([]);
      
      // 4. Force Element Re-render
      setAudioVersion(v => v + 1);

      // 5. Update State
      setAudioMode(mode); 
      setAudioUrl(url); 
      setAudioTitle(title || null); 
      setIsPlaying(true);

      // 6. Schedule Analysis (Delayed)
      if (mode === 'file' && url) {
          setTimeout(() => {
              // Only run if user hasn't switched song again
              if (analysisIdRef.current === newAnalysisId) {
                  analyzeAudio(url, lang || 'turkish', newAnalysisId);
              }
          }, 1500); 
      } else { 
          setShowLyrics(false); 
          setIsSceneVisible(true); 
      }
  };
  
  const handleClearCanvas = () => { setClearCanvasTrigger(prev => prev + 1); };
  const handleShapeChange = (shape: ShapeType) => { setCurrentShape(shape); setCurrentText(''); setImageSourceXY(null); setImageSourceYZ(null); setUseImageColors(false); setDepthIntensity(0); setIsSceneVisible(true); setShowLyrics(false); };
  const handleResetAll = () => {
    setCurrentText(''); setParticleColor('#ffffff'); setImageSourceXY(null); setImageSourceYZ(null); setUseImageColors(false); setDepthIntensity(0); setActivePreset('none'); setAudioMode('none'); setAudioUrl(null); setAudioTitle(null); setIsPlaying(true); setRepulsionStrength(50); setRepulsionRadius(50); setParticleCount(40000); setParticleSize(20); setModelDensity(50); setIsDrawing(false); setCanvasRotation([0, 0, 0]); setCurrentShape('sphere'); setCameraResetTrigger(prev => prev + 1); setBgMode('dark'); setIsSceneVisible(true); setBgImage(null); setCroppedBgImage(null); setSlideshowSettings(prev => ({...prev, active: false})); setIsAutoRotating(false); setShowLyrics(false); setLyrics([]); setIsAnalyzing(false); setUseLyricParticles(false); setActiveLyricText(''); setUseLyricEcho(false);
  };
  const rotateCanvasX = () => setCanvasRotation(prev => [prev[0] + Math.PI / 2, prev[1], prev[2]]);
  const rotateCanvasY = () => setCanvasRotation(prev => [prev[0], prev[1] + Math.PI / 2, prev[2]]);
  const rotateCanvasZ = () => setCanvasRotation(prev => [prev[0], prev[1], prev[2] + Math.PI / 2]);

  const displayImage = bgMode === 'image' ? (croppedBgImage || bgImage) : null;

  // --- Screensaver & App Layer Styles ---
  let appDuration = '0.25s', ssDuration = '0.25s';
  let appFilter = 'blur(0px) brightness(1)', appTransform = 'scale(1)', appInset = '0px', appRadius = '0px';
  let ssTransform = 'translateY(100%)', ssInset = '20px', ssBlur = 'blur(10px)', ssOpacity = '0', ssPointer = 'none', ssRadius = '30px', ssScale = '0.95';

  switch (ssState) {
      case 'idle': break;
      case 'e1_app_blur': appDuration = '0.25s'; appFilter = 'blur(0px) brightness(1)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)'; break;
      case 'e2_app_shrink': appDuration = '0.25s'; appFilter = 'blur(10px) brightness(0.7)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)'; ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(100%)'; ssBlur = 'blur(10px)'; break;
      case 'e3_ss_slide_up': appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)'; ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(0)'; ssInset = '20px'; ssBlur = 'blur(10px)'; ssRadius = '30px'; ssScale = '0.95'; break;
      case 'e4_ss_unblur': appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)'; ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(0)'; ssBlur = 'blur(0px)'; ssInset = '20px'; ssRadius = '30px'; ssScale = '0.95'; break;
      case 'e5_ss_expand': appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)'; ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(0)'; ssBlur = 'blur(0px)'; ssInset = '0px'; ssRadius = '0px'; ssScale = '1'; break;
      case 'active': appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)'; ssOpacity = '1'; ssPointer = 'auto'; ssTransform = 'translateY(0)'; ssBlur = 'blur(0px)'; ssInset = '0px'; ssRadius = '0px'; ssScale = '1'; break;
      case 'x1_ss_shrink': appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)'; ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(0)'; ssBlur = 'blur(0px)'; ssInset = '20px'; ssRadius = '30px'; ssScale = '0.95'; break;
      case 'x2_ss_blur': appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)'; ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(0)'; ssBlur = 'blur(10px)'; ssInset = '20px'; ssRadius = '30px'; ssScale = '0.95'; break;
      case 'x3_ss_slide_down': appFilter = 'blur(10px) brightness(0.5)'; appInset = '20px'; appRadius = '30px'; appTransform = 'scale(0.95)'; ssDuration = '0.25s'; ssOpacity = '1'; ssTransform = 'translateY(100%)'; ssBlur = 'blur(10px)'; ssInset = '20px'; ssRadius = '30px'; ssScale = '0.95'; break;
      case 'x4_app_expand': ssOpacity = '1'; ssTransform = 'translateY(100%)'; appDuration = '0.25s'; appFilter = 'blur(10px) brightness(0.7)'; appInset = '0px'; appRadius = '0px'; appTransform = 'scale(1)'; break;
      case 'x5_app_unblur': ssOpacity = '0'; ssDuration = '0.25s'; appDuration = '0.25s'; appFilter = 'blur(0px) brightness(1)'; appInset = '0px'; appRadius = '0px'; appTransform = 'scale(1)'; break;
  }

  const appLayerStyle: React.CSSProperties = { transition: `all ${appDuration} cubic-bezier(0.4, 0, 0.2, 1)`, position: 'absolute', overflow: 'hidden', zIndex: 0, filter: appFilter, transform: appTransform, top: appInset !== '0px' ? appInset : 0, left: appInset !== '0px' ? appInset : 0, right: appInset !== '0px' ? appInset : 0, bottom: appInset !== '0px' ? appInset : 0, width: appInset !== '0px' ? `calc(100% - ${parseInt(appInset)*2}px)` : '100%', height: appInset !== '0px' ? `calc(100% - ${parseInt(appInset)*2}px)` : '100%', borderRadius: appRadius };
  const ssLayerStyle: React.CSSProperties = { transition: `all ${ssDuration} cubic-bezier(0.4, 0, 0.2, 1)`, position: 'absolute', zIndex: 100, opacity: ssOpacity, pointerEvents: ssPointer as any, transform: ssTransform.includes('translate') ? `${ssTransform} scale(${ssScale})` : ssTransform, top: ssInset !== '0px' ? ssInset : 0, left: ssInset !== '0px' ? ssInset : 0, right: ssInset !== '0px' ? ssInset : 0, bottom: ssInset !== '0px' ? ssInset : 0, width: ssInset !== '0px' ? `calc(100% - ${parseInt(ssInset)*2}px)` : '100%', height: ssInset !== '0px' ? `calc(100% - ${parseInt(ssInset)*2}px)` : '100%', filter: ssBlur, borderRadius: ssRadius };

  // Prioritize Lyric Text over Current Text if enabled
  const displayParticlesText = (useLyricParticles && activeLyricText) ? activeLyricText : currentText;

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

      {audioUrl && (
          // KEY PROP IS CRITICAL HERE FOR RESETTING PLAYER
          <audio key={audioVersion} ref={hiddenAudioRef} src={audioUrl} loop hidden crossOrigin="anonymous" />
      )}

      <div id="app-layer" style={appLayerStyle} className="bg-black shadow-2xl">
          <div className="relative w-full h-full overflow-hidden">
            <div className="absolute inset-0 z-0 transition-colors duration-1000 ease-in-out" style={{ backgroundColor: bgMode === 'dark' ? '#000' : bgMode === 'light' ? '#fff' : bgMode === 'color' ? customBgColor : 'transparent' }}>
                {displayImage && (<img key={displayImage} src={displayImage} alt="background" className={`w-full h-full object-cover select-none pointer-events-none ${slideshowSettings.active ? activeTransitionClass : 'transition-opacity duration-700'}`} style={{ objectFit: bgImageStyle, objectPosition: 'center center' }} />)}
                {bgMode === 'gradient' && ( <div className="w-full h-full bg-[linear-gradient(45deg,#ff0000,#ff7300,#fffb00,#48ff00,#00ffd5,#002bff,#7a00ff,#ff00c8,#ff0000)] bg-[length:400%_400%] animate-gradient-xy opacity-80" style={{ animation: 'gradientMove 15s ease infinite' }} /> )}
                {bgMode === 'auto' && ( <div className="w-full h-full animate-color-cycle" /> )}
            </div>
            
            <ClockWidget isMinimized={isWidgetMinimized} onToggleMinimize={() => setIsWidgetMinimized(!isWidgetMinimized)} bgMode={bgMode} bgImageStyle={bgImageStyle} isUIHidden={isUIHidden} ssBgColor={ssBgColor} setSsBgColor={setSsBgColor} ssTextColor={ssTextColor} setSsTextColor={setSsTextColor} userText={widgetUserText} onUserTextChange={setWidgetUserText} />

            {/* Non-intrusive Analysis Indicator */}
            {isAnalyzing && (
                <div className="absolute top-20 right-6 z-30 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-3 animate-pulse shadow-[0_0_15px_#3b82f6]">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-white text-xs font-mono tracking-wider">{analysisStatus}</span>
                </div>
            )}

            {/* DOM Lyrics Box - Only show if Particles are disabled and we have lyrics */}
            {showLyrics && !useLyricParticles && ( <LyricsBox lyrics={lyrics} currentTime={audioCurrentTime} duration={audioDuration} audioRef={hiddenAudioRef} visible={showLyrics} /> )}

            <div className={`absolute inset-0 z-10 transition-all duration-1000 ${isSceneVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none blur-sm'}`}>
                <Experience 
                  text={displayParticlesText} 
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
                  analyser={analyserRef.current} 
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
                  enableAudioReactivity={useLyricEcho} // Pass down new prop
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
                // NEW PROPS
                useLyricParticles={useLyricParticles}
                onToggleLyricParticles={() => setUseLyricParticles(!useLyricParticles)}
                hasLyrics={lyrics.length > 0}
                useLyricEcho={useLyricEcho}
                onToggleLyricEcho={() => setUseLyricEcho(!useLyricEcho)}
            />
          </div>
      </div>

      <div id="screensaver-layer" style={ssLayerStyle} className="shadow-2xl">
          <Screensaver active={ssState === 'active' || ssState.startsWith('e') || ssState.startsWith('x')} onClick={handleScreensaverClick} bgColor={ssBgColor} textColor={ssTextColor} userText={widgetUserText} />
      </div>
    </div>
  );
};

export default App;