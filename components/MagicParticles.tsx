import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

const SPHERE_RADIUS = 4;
const FONT_URL = 'https://cdn.jsdelivr.net/npm/three/examples/fonts/droid/droid_sans_bold.typeface.json';

type PresetType = 'none' | 'electric' | 'fire' | 'water' | 'mercury' | 'disco';
type AudioMode = 'none' | 'file' | 'mic';

interface MagicParticlesProps {
  text: string;
  image: string | null;
  useImageColors: boolean;
  color: string;
  disableMouseRepulsion: boolean;
  depthIntensity: number;
  repulsionStrength: number; 
  repulsionRadius: number; 
  particleCount: number; 
  particleSpacing: number;
  previousPositions: React.MutableRefObject<Float32Array | null>;
  activePreset: PresetType;
  audioMode: AudioMode;
  audioUrl: string | null;
  isDrawing: boolean;
}

export const MagicParticles: React.FC<MagicParticlesProps> = ({ 
  text, 
  image, 
  useImageColors, 
  color, 
  disableMouseRepulsion, 
  depthIntensity,
  repulsionStrength,
  repulsionRadius,
  particleCount,
  particleSpacing,
  previousPositions,
  activePreset,
  audioMode,
  audioUrl,
  isDrawing
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera, gl } = useThree();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isRightClicking = useRef(false);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const boundsRef = useRef<{minX: number, maxX: number}>({ minX: -5, maxX: 5 });

  // --- Audio Setup ---
  useEffect(() => {
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
    }

    if (audioMode === 'none') return;

    const initAudio = async () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256; 
            analyser.smoothingTimeConstant = 0.5; 
            analyser.minDecibels = -90;
            analyser.maxDecibels = -10;
            analyserRef.current = analyser;

            const bufferLength = analyser.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            if (audioMode === 'file' && audioUrl) {
                const audioEl = new Audio(audioUrl);
                audioEl.crossOrigin = "anonymous";
                audioEl.loop = true;
                audioEl.play().catch(e => console.warn("Otomatik oynatma engellendi.", e));
                
                audioElementRef.current = audioEl;
                const source = ctx.createMediaElementSource(audioEl);
                audioSourceRef.current = source;
                
                source.connect(analyser);
                analyser.connect(ctx.destination);
            } 
            else if (audioMode === 'mic') {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const source = ctx.createMediaStreamSource(stream);
                audioSourceRef.current = source;
                
                source.connect(analyser);
            }
        } catch (err) {
            console.error("Ses başlatma hatası:", err);
        }
    };

    initAudio();

    return () => {
        if (audioContextRef.current) audioContextRef.current.close();
        if (audioElementRef.current) audioElementRef.current.pause();
    };
  }, [audioMode, audioUrl]);

  const spherePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2; 
      const radius = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;

      const x = Math.cos(theta) * radius * SPHERE_RADIUS;
      const z = Math.sin(theta) * radius * SPHERE_RADIUS;
      const yPos = y * SPHERE_RADIUS;

      positions[i * 3] = x;
      positions[i * 3 + 1] = yPos;
      positions[i * 3 + 2] = z;
    }
    boundsRef.current = { minX: -SPHERE_RADIUS, maxX: SPHERE_RADIUS };
    return positions;
  }, [particleCount]);

  const simulationData = useMemo(() => {
    const current = new Float32Array(particleCount * 3);
    const targets = new Float32Array(particleCount * 3);
    
    targets.set(spherePositions);
    current.set(spherePositions);

    if (previousPositions && previousPositions.current) {
        const prev = previousPositions.current;
        const copyLength = Math.min(prev.length, current.length);
        current.set(prev.subarray(0, copyLength), 0);
    }

    return {
      current,
      velocities: new Float32Array(particleCount * 3),
      targets,
      colors: new Float32Array(particleCount * 3),
      zOffsets: new Float32Array(particleCount),
      originalColors: new Float32Array(particleCount * 3)
    };
  }, [particleCount, spherePositions, previousPositions]);

  // --- Event Listeners ---
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 2) {
        isRightClicking.current = true;
      }
      
      if (disableMouseRepulsion) return;

      if (e.button === 0) { 
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        const { velocities } = simulationData;
        const explodeForce = 2.0 + (repulsionStrength / 100) * 8.0; 
        
        for (let i = 0; i < particleCount * 3; i++) {
            let mod = 1.0;
            if (activePreset === 'water') mod = 0.5; 
            if (activePreset === 'electric') mod = 1.5; 
            if (activePreset === 'mercury') mod = 0.3; 
            if (activePreset === 'disco') mod = 1.2;
            
            velocities[i] += (Math.random() - 0.5) * explodeForce * mod; 
        }
      }
    };

    const handlePointerUp = () => { isRightClicking.current = false; };

    gl.domElement.addEventListener('pointerdown', handlePointerDown);
    gl.domElement.addEventListener('pointerup', handlePointerUp);

    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
      gl.domElement.removeEventListener('pointerup', handlePointerUp);
    };
  }, [gl.domElement, simulationData, disableMouseRepulsion, repulsionStrength, particleCount, activePreset]);

  // --- Reset / Init ---
  useEffect(() => {
    if (!text && !image && !isProcessing) {
        simulationData.targets.set(spherePositions);
        simulationData.zOffsets.fill(0);
        boundsRef.current = { minX: -SPHERE_RADIUS, maxX: SPHERE_RADIUS };
    }
  }, [text, image, spherePositions, simulationData, isProcessing]);

  // --- Color Management ---
  useEffect(() => {
    const { colors, originalColors } = simulationData;

    if (activePreset === 'none') {
        if (image && useImageColors) {
            colors.set(originalColors);
        } else {
            const c = new THREE.Color(color);
            for(let i=0; i<particleCount; i++) {
              const r = c.r;
              const g = c.g;
              const b = c.b;

              colors[i*3] = r;
              colors[i*3+1] = g;
              colors[i*3+2] = b;

              originalColors[i*3] = r;
              originalColors[i*3+1] = g;
              originalColors[i*3+2] = b;
            }
        }
        if (pointsRef.current) {
            pointsRef.current.geometry.attributes.color.needsUpdate = true;
        }
    }
  }, [color, useImageColors, image, simulationData, particleCount, activePreset]);

  // --- Depth ---
  useEffect(() => {
    if (image) {
        const targets = simulationData.targets;
        const zOffsets = simulationData.zOffsets;
        for(let i=0; i < particleCount; i++) {
            targets[i * 3 + 2] = zOffsets[i] * depthIntensity;
        }
    }
  }, [depthIntensity, image, simulationData, particleCount]);

  // --- Text Mesh Generation ---
  useEffect(() => {
    if (image || isProcessing) return;
    if (!text || text.trim() === '') return;

    const loader = new FontLoader();
    loader.load(FONT_URL, (font) => {
      const fontSize = 2;
      const shapes = font.generateShapes(text, fontSize);
      if (shapes.length === 0) {
          simulationData.targets.set(spherePositions);
          return;
      }
      const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: 1.5, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.2, bevelSegments: 4, curveSegments: 8
      });
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox!;
      const xMid = -0.5 * (bbox.max.x - bbox.min.x);
      const yMid = -0.5 * (bbox.max.y - bbox.min.y);
      const zMid = -0.5 * (bbox.max.z - bbox.min.z);
      geometry.translate(xMid, yMid, zMid);
      
      boundsRef.current = { minX: bbox.min.x + xMid, maxX: bbox.max.x + xMid };

      const maxDim = Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y);
      const targetSize = SPHERE_RADIUS * 2.2; 
      const scaleFactor = targetSize / (maxDim || 1);
      geometry.scale(scaleFactor, scaleFactor, scaleFactor);
      
      boundsRef.current.minX *= scaleFactor;
      boundsRef.current.maxX *= scaleFactor;

      if (geometry.index) geometry.toNonIndexed();
      const posAttribute = geometry.attributes.position;
      const triangleCount = posAttribute.count / 3;

      if (triangleCount === 0) { geometry.dispose(); return; }

      const triangleAreas = [];
      let totalArea = 0;
      const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
      const va = new THREE.Vector3(), vb = new THREE.Vector3();

      for (let i = 0; i < triangleCount; i++) {
        const i3 = i * 3;
        a.fromBufferAttribute(posAttribute, i3);
        b.fromBufferAttribute(posAttribute, i3 + 1);
        c.fromBufferAttribute(posAttribute, i3 + 2);
        va.subVectors(b, a);
        vb.subVectors(c, a);
        const area = va.cross(vb).length() * 0.5;
        triangleAreas.push(area);
        totalArea += area;
      }

      const cumulativeAreas = new Float32Array(triangleCount);
      let acc = 0;
      for (let i = 0; i < triangleCount; i++) { acc += triangleAreas[i]; cumulativeAreas[i] = acc; }

      const newTargets = new Float32Array(particleCount * 3);
      const tempTarget = new THREE.Vector3();

      for (let i = 0; i < particleCount; i++) {
        const r = Math.random() * totalArea;
        let left = 0, right = triangleCount - 1, selectedTriangleIndex = 0;
        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          if (cumulativeAreas[mid] >= r) { selectedTriangleIndex = mid; right = mid - 1; } 
          else { left = mid + 1; }
        }
        const i3 = selectedTriangleIndex * 3;
        a.fromBufferAttribute(posAttribute, i3);
        b.fromBufferAttribute(posAttribute, i3 + 1);
        c.fromBufferAttribute(posAttribute, i3 + 2);
        let r1 = Math.random(), r2 = Math.random();
        if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
        tempTarget.copy(a).addScaledVector(b.clone().sub(a), r1).addScaledVector(c.clone().sub(a), r2);
        newTargets[i * 3] = tempTarget.x;
        newTargets[i * 3 + 1] = tempTarget.y;
        newTargets[i * 3 + 2] = tempTarget.z;
      }
      simulationData.targets.set(newTargets);
      simulationData.zOffsets.fill(0); 
      geometry.dispose();
    }, undefined, (err) => { console.error("Font hatası:", err); simulationData.targets.set(spherePositions); });
  }, [text, image, spherePositions, simulationData, particleCount, isProcessing]);

  // --- Image Processing ---
  useEffect(() => {
    if (!image) return;
    
    setIsProcessing(true);

    const img = new Image();
    
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 1024; 
        let w = img.width; let h = img.height;
        if (w > h) { if (w > maxSize) { h *= maxSize / w; w = maxSize; } } 
        else { if (h > maxSize) { w *= maxSize / h; h = maxSize; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { setIsProcessing(false); return; }
        
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const validPixels = [];
        
        for (let y = 0; y < h; y += 2) {
            for (let x = 0; x < w; x += 2) {
                const index = (y * w + x) * 4;
                if (data[index + 3] > 10) { 
                    validPixels.push({
                        x: (x / w) - 0.5, y: 0.5 - (y / h), 
                        r: data[index]/255, g: data[index+1]/255, b: data[index+2]/255,
                        // Luminance artık Z için kullanılmayacak, sadece renk referansı
                        luminance: (0.2126 * data[index] + 0.7152 * data[index+1] + 0.0722 * data[index+2]) / 255
                    });
                }
            }
        }

        if (validPixels.length === 0) {
            console.warn("Geçerli piksel bulunamadı");
            setIsProcessing(false);
            return;
        }
        
        const aspect = w / h;
        const targetScale = SPHERE_RADIUS * 2.0; 
        
        const newTargets = new Float32Array(particleCount * 3);
        const newColors = new Float32Array(particleCount * 3);
        const newOriginalColors = new Float32Array(particleCount * 3);
        const newZOffsets = new Float32Array(particleCount);
        const defaultColorRGB = new THREE.Color(color);
        
        let minX = Infinity, maxX = -Infinity;

        for(let i = 0; i < particleCount; i++) {
            const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];
            const pX = pixel.x * targetScale;
            const pY = pixel.y * targetScale;
            
            let finalX = 0, finalY = 0;
            if (aspect > 1) { finalX = pX * aspect; finalY = pY; } 
            else { finalX = pX; finalY = pY / aspect; }
            
            if (finalX < minX) minX = finalX;
            if (finalX > maxX) maxX = finalX;

            newTargets[i * 3] = finalX; 
            newTargets[i * 3 + 1] = finalY;

            // ÖNEMLİ DEĞİŞİKLİK: Z DEĞERİNİ RASTGELE DAĞITIYORUZ
            // Böylece şekil sadece bir düzlem değil, hacimli bir obje (extruded) gibi görünür.
            // [-0.5, 0.5] aralığında rastgele bir değer. 
            // depthIntensity ile çarpılınca (örn: 2.0), toplam kalınlık artar.
            newZOffsets[i] = (Math.random() - 0.5); 
            
            newTargets[i * 3 + 2] = newZOffsets[i] * depthIntensity;
            
            newOriginalColors[i * 3] = pixel.r; newOriginalColors[i * 3 + 1] = pixel.g; newOriginalColors[i * 3 + 2] = pixel.b;
            if (useImageColors) { newColors[i * 3] = pixel.r; newColors[i * 3 + 1] = pixel.g; newColors[i * 3 + 2] = pixel.b; } 
            else { newColors[i * 3] = defaultColorRGB.r; newColors[i * 3 + 1] = defaultColorRGB.g; newColors[i * 3 + 2] = defaultColorRGB.b; }
        }
        
        boundsRef.current = { minX, maxX };

        simulationData.targets.set(newTargets);
        simulationData.colors.set(newColors);
        simulationData.zOffsets.set(newZOffsets);
        simulationData.originalColors.set(newOriginalColors);
        if (pointsRef.current) pointsRef.current.geometry.attributes.color.needsUpdate = true;
        
        setIsProcessing(false);
    };

    img.onerror = () => {
        console.error("Resim yükleme hatası");
        setIsProcessing(false);
    }
    
    img.src = image;
    
  }, [image, simulationData, particleCount, color, useImageColors, depthIntensity]);

  // --- Animation Loop ---
  useFrame((state) => {
    // Çizim modundaysak veya işleniyorsa animasyonu durdur
    if (isDrawing || isProcessing || !pointsRef.current) return;

    // AUDIO VERİSİNİ AL
    let isAudioActive = audioMode !== 'none';
    let avgVolume = 0;

    if (isAudioActive && analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        let sum = 0;
        const len = dataArrayRef.current.length;
        for(let k=0; k < len; k++) {
            sum += dataArrayRef.current[k];
        }
        avgVolume = sum / len;
        
        if (avgVolume < 5) isAudioActive = false;
    } else {
        isAudioActive = false;
    }

    const { current, targets, velocities } = simulationData;
    const positionsAttribute = pointsRef.current.geometry.attributes.position;
    const colorsAttribute = pointsRef.current.geometry.attributes.color;
    
    // --- MOUSE INTERACTION ---
    const pointer = state.pointer;
    const isInsideCanvas = Math.abs(pointer.x) <= 1.05 && Math.abs(pointer.y) <= 1.05;

    let interactionTarget = new THREE.Vector3();
    let hasInteractionTarget = false;

    if (isInsideCanvas && !disableMouseRepulsion && !isRightClicking.current && repulsionStrength > 0) {
        state.raycaster.setFromCamera(pointer, camera);
        const ray = state.raycaster.ray;

        if (!text && !image) {
            const O = ray.origin;
            const D = ray.direction;
            const rSq = SPHERE_RADIUS * SPHERE_RADIUS;
            const b = 2 * O.dot(D);
            const c = O.lengthSq() - rSq;
            const delta = b * b - 4 * c;

            if (delta >= 0) {
                const sqrtDelta = Math.sqrt(delta);
                const t1 = (-b - sqrtDelta) / 2;
                const t2 = (-b + sqrtDelta) / 2;
                let t = t1 < t2 ? t1 : t2; 
                if (t < 0) t = t2; 
                
                if (t > 0) {
                    interactionTarget.copy(O).addScaledVector(D, t);
                    hasInteractionTarget = true;
                }
            }
        }

        if (!hasInteractionTarget) {
             const t = -ray.origin.z / ray.direction.z;
             if (t > 0) {
                 interactionTarget.copy(ray.origin).addScaledVector(ray.direction, t);
                 hasInteractionTarget = true;
             }
        }
    }

    // FİZİK AYARLARI
    let springStrength = 0.05;
    let friction = 0.94;
    
    if (isAudioActive) {
        springStrength = 0.15; 
        friction = 0.80;      
    }

    if (activePreset === 'water') { springStrength = 0.02; friction = 0.96; } 
    else if (activePreset === 'mercury') { springStrength = 0.08; friction = 0.90; } 
    else if (activePreset === 'electric') { springStrength = 0.1; friction = 0.85; }
    else if (activePreset === 'disco') { springStrength = 0.06; friction = 0.92; }

    const dynamicRepulsionRadius = 1.0 + (repulsionRadius / 100) * 5.0; 
    const repulsionForce = (repulsionStrength / 50.0);
    const time = state.clock.elapsedTime;
    
    const { minX, maxX } = boundsRef.current;
    const width = maxX - minX || 1;
    const bufferLength = dataArrayRef.current ? dataArrayRef.current.length : 1;
    const discoColor = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      const px = current[ix];
      const py = current[iy];
      const pz = current[iz];

      let vx = velocities[ix];
      let vy = velocities[iy];
      let vz = velocities[iz];
      
      let tx = targets[ix];
      let ty = targets[iy];
      let tz = targets[iz];

      let freqValue = 0;

      if (isAudioActive && dataArrayRef.current) {
          let binIndex = 0;
          
          if (!text && !image) {
              binIndex = i % (bufferLength / 2); 
          } else {
              let normalizedX = (tx - minX) / width;
              if (normalizedX < 0) normalizedX = 0;
              if (normalizedX > 1) normalizedX = 1;
              const activeSpectrumRatio = 0.4; 
              const maxActiveBin = Math.floor(bufferLength * activeSpectrumRatio);
              binIndex = Math.floor(normalizedX * maxActiveBin);
              if (binIndex >= bufferLength) binIndex = bufferLength - 1;
          }

          const rawVal = dataArrayRef.current[binIndex] / 255.0;
          freqValue = rawVal;
          const isBass = binIndex < bufferLength * 0.1;
          const boost = isBass ? 1.5 : 1.0; 
          
          if (!text && !image) {
              const spike = rawVal * 3.0 * boost;
              const len = Math.sqrt(tx*tx + ty*ty + tz*tz) || 1;
              tx += (tx / len) * spike;
              ty += (ty / len) * spike;
              tz += (tz / len) * spike;
          } else {
              tz += rawVal * 4.0 * boost;
          }
      }

      vx += (tx - px) * springStrength;
      vy += (ty - py) * springStrength;
      vz += (tz - pz) * springStrength;

      if (activePreset === 'fire') {
         vy += 0.005 + Math.random() * 0.005; 
         vx += (Math.random() - 0.5) * 0.01;
      } 
      else if (activePreset === 'water') {
         vz += Math.sin(time * 2 + px * 0.5) * 0.002;
         vy += Math.cos(time * 1.5 + pz * 0.5) * 0.001;
      }
      else if (activePreset === 'electric') {
         if (Math.random() > 0.95) {
             vx += (Math.random() - 0.5) * 0.2;
             vy += (Math.random() - 0.5) * 0.2;
             vz += (Math.random() - 0.5) * 0.2;
         }
      }
      else if (activePreset === 'disco') {
         vx += Math.sin(time * 3 + py * 0.5) * 0.001;
         vy += Math.cos(time * 2 + px * 0.5) * 0.001;
      }

      if (hasInteractionTarget) {
        const dx = px - interactionTarget.x;
        const dy = py - interactionTarget.y;
        const dz = pz - interactionTarget.z;

        const distSq = dx*dx + dy*dy + dz*dz;

        if (distSq < dynamicRepulsionRadius * dynamicRepulsionRadius) {
            const dist = Math.sqrt(distSq);
            let force = (1 - dist / dynamicRepulsionRadius) * repulsionForce;
            
            if (activePreset === 'electric') force *= 2.0;
            else if (activePreset === 'mercury') force *= 0.5;

            let nx, ny, nz;
            if (dist > 0.0001) {
                nx = dx / dist;
                ny = dy / dist;
                nz = dz / dist;
            } else {
                nx = (Math.random() - 0.5);
                ny = (Math.random() - 0.5);
                nz = (Math.random() - 0.5);
            }

            vx += nx * force;
            vy += ny * force;
            vz += nz * force;
        }
      }

      vx *= friction;
      vy *= friction;
      vz *= friction;

      current[ix] += vx;
      current[iy] += vy;
      current[iz] += vz;

      velocities[ix] = vx;
      velocities[iy] = vy;
      velocities[iz] = vz;

      positionsAttribute.setXYZ(i, current[ix], current[iy], current[iz]);

      if (isAudioActive || activePreset !== 'none') {
          let r=1, g=1, b=1;
          let baseR = 1, baseG = 1, baseB = 1;
          
          if (activePreset === 'none') {
              baseR = simulationData.originalColors[ix] || 1;
              baseG = simulationData.originalColors[iy] || 1;
              baseB = simulationData.originalColors[iz] || 1;
          }

          if (activePreset === 'none') {
             const intensity = freqValue * 1.5; 
             r = baseR + intensity * 0.6;
             g = baseG + intensity * 0.6;
             b = baseB + intensity * 0.6;
          } 
          else {
              const beatFlash = freqValue * 0.8;
              
              if (activePreset === 'electric') {
                const isFlash = Math.random() > 0.98;
                if (isFlash) { r=1; g=1; b=1; } 
                else { r=0.1 + beatFlash; g=0.5 + beatFlash; b=1.0; } 
              }
              else if (activePreset === 'fire') {
                  const heightFactor = Math.min(1, Math.max(0, (py + 4) / 8));
                  r = 1.0;
                  g = heightFactor * 0.8 + beatFlash; 
                  b = 0.1 + beatFlash;
              }
              else if (activePreset === 'water') {
                  const depthFactor = Math.sin(time + px);
                  r = 0.0 + beatFlash;
                  g = 0.5 + depthFactor * 0.2 + beatFlash;
                  b = 1.0;
              }
              else if (activePreset === 'mercury') {
                  const shine = Math.abs(Math.sin(px * 2 + time));
                  r = 0.6 + shine * 0.4 + beatFlash;
                  g = 0.6 + shine * 0.4 + beatFlash;
                  b = 0.7 + shine * 0.3 + beatFlash;
              }
              else if (activePreset === 'disco') {
                  const hue = (time * 0.2 + px * 0.05 + py * 0.05) % 1.0;
                  discoColor.setHSL(hue, 1.0, 0.5);
                  r = discoColor.r + beatFlash;
                  g = discoColor.g + beatFlash;
                  b = discoColor.b + beatFlash;
              }
          }
          colorsAttribute.setXYZ(i, Math.min(1,r), Math.min(1,g), Math.min(1,b));
      }
    }

    positionsAttribute.needsUpdate = true;
    if (activePreset !== 'none' || isAudioActive) {
        colorsAttribute.needsUpdate = true;
    }

    if (previousPositions) {
        previousPositions.current = current;
    }
  });
  
  if (isDrawing || isProcessing) return null;

  let computedSize = Math.max(0.01, 0.06 - (particleSpacing / 50) * 0.05);
  if (activePreset === 'mercury') computedSize *= 1.5;

  return (
    <points ref={pointsRef} key={particleCount}> 
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={simulationData.current}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={simulationData.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff" 
        vertexColors={true}
        size={computedSize} 
        sizeAttenuation={true}
        transparent={true}
        opacity={activePreset === 'mercury' ? 1.0 : 0.9} 
        blending={activePreset === 'fire' || activePreset === 'electric' || activePreset === 'disco' ? THREE.AdditiveBlending : THREE.NormalBlending} 
        depthWrite={false}
      />
    </points>
  );
};