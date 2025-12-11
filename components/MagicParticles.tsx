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
  imageXY: string | null;
  imageYZ: string | null;
  useImageColors: boolean;
  color: string;
  disableMouseRepulsion: boolean;
  depthIntensity: number;
  repulsionStrength: number; 
  repulsionRadius: number; 
  particleCount: number; 
  particleSize: number; 
  modelDensity: number; 
  previousPositions: React.MutableRefObject<Float32Array | null>;
  activePreset: PresetType;
  audioMode: AudioMode;
  audioUrl: string | null;
  isDrawing: boolean;
  canvasRotation?: [number, number, number];
}

export const MagicParticles: React.FC<MagicParticlesProps> = ({ 
  text, 
  imageXY,
  imageYZ,
  useImageColors, 
  color, 
  disableMouseRepulsion, 
  depthIntensity,
  repulsionStrength,
  repulsionRadius,
  particleCount,
  particleSize,
  modelDensity,
  previousPositions,
  activePreset,
  audioMode,
  audioUrl,
  isDrawing,
  canvasRotation = [0, 0, 0]
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
  const randomnessRef = useRef<Float32Array | null>(null);
  
  // Cache for Normalized Shapes (0-1 range) to prevent reprocessing on density change
  const normalizedShapeRef = useRef<{
      targets: Float32Array | null,
      zOffsets: Float32Array | null
  }>({ targets: null, zOffsets: null });

  // Density Scale Calc
  const densityScale = useMemo(() => {
     if (modelDensity <= 50) {
         return 2.5 - (modelDensity / 50) * 1.5;
     } else {
         return 1.0 - ((modelDensity - 50) / 50) * 0.6;
     }
  }, [modelDensity]);

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

  // --- Sphere Positions Calculation ---
  const spherePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    // Base radius (density applied later for sphere optimization)
    // Actually apply density here for sphere since it's procedural
    const effectiveRadius = SPHERE_RADIUS * densityScale;

    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2; 
      const radius = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;

      const x = Math.cos(theta) * radius * effectiveRadius;
      const z = Math.sin(theta) * radius * effectiveRadius;
      const yPos = y * effectiveRadius;

      positions[i * 3] = x;
      positions[i * 3 + 1] = yPos;
      positions[i * 3 + 2] = z;
    }
    boundsRef.current = { minX: -effectiveRadius, maxX: effectiveRadius };
    
    if (!randomnessRef.current || randomnessRef.current.length !== particleCount) {
        randomnessRef.current = new Float32Array(particleCount);
        for(let i=0; i<particleCount; i++) {
            randomnessRef.current[i] = (Math.random() - 0.5);
        }
    }
    return positions;
  }, [particleCount, densityScale]);

  // --- Initialize Simulation Data ---
  const simulationData = useMemo(() => {
    const current = new Float32Array(particleCount * 3);
    const targets = new Float32Array(particleCount * 3);
    
    targets.set(spherePositions);
    
    if (previousPositions && previousPositions.current && previousPositions.current.length === particleCount * 3) {
        current.set(previousPositions.current);
    } else {
        current.set(spherePositions);
    }

    return {
      current,
      velocities: new Float32Array(particleCount * 3),
      targets,
      colors: new Float32Array(particleCount * 3),
      zOffsets: new Float32Array(particleCount * 3), 
      originalColors: new Float32Array(particleCount * 3)
    };
  }, [particleCount]);

  // --- Sync Sphere Targets when Density Changes ---
  useEffect(() => {
      if (!text && !imageXY && !imageYZ && !isProcessing) {
          simulationData.targets.set(spherePositions);
          // Reset Normalized Cache when going back to sphere
          normalizedShapeRef.current.targets = null;
      }
  }, [spherePositions, text, imageXY, imageYZ, isProcessing, simulationData]);

  // --- DENSITY CHANGE OPTIMIZATION (Prevent Explosion) ---
  // Sadece densityScale değiştiğinde ve elimizde cachelenmiş normalize data varsa
  // Görüntüyü baştan işlemek yerine sadece scale çarpanını güncelle.
  useEffect(() => {
      if ((imageXY || imageYZ || text) && normalizedShapeRef.current.targets) {
          const normTargets = normalizedShapeRef.current.targets;
          const currentTargets = simulationData.targets;
          const count = particleCount;
          // Scale factor: Base Scale * Density Scale
          const scale = (SPHERE_RADIUS * 2.0) * densityScale; 

          for(let i=0; i < count; i++) {
              currentTargets[i*3]     = normTargets[i*3] * scale;
              currentTargets[i*3 + 1] = normTargets[i*3 + 1] * scale;
              currentTargets[i*3 + 2] = normTargets[i*3 + 2] * scale;
          }
      }
  }, [densityScale, imageXY, imageYZ, text, particleCount, simulationData]);


  // Event Listeners (Mouse Interaction)
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
        const explodeForce = 3.0 + (repulsionStrength / 100) * 10.0;
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

  // Color Updates
  useEffect(() => {
    const { colors, originalColors } = simulationData;
    if (activePreset === 'none') {
        if ((imageXY || imageYZ) && useImageColors) {
            colors.set(originalColors);
        } else {
            const c = new THREE.Color(color);
            for(let i=0; i<particleCount; i++) {
              const r = c.r; const g = c.g; const b = c.b;
              colors[i*3] = r; colors[i*3+1] = g; colors[i*3+2] = b;
              originalColors[i*3] = r; originalColors[i*3+1] = g; originalColors[i*3+2] = b;
            }
        }
        if (pointsRef.current) {
            pointsRef.current.geometry.attributes.color.needsUpdate = true;
        }
    }
  }, [color, useImageColors, imageXY, imageYZ, simulationData, particleCount, activePreset]);

  // --- Text Processing ---
  useEffect(() => {
    if (imageXY || imageYZ || isProcessing) return;
    if (!text || text.trim() === '') return;

    setIsProcessing(true);
    const loader = new FontLoader();
    loader.load(FONT_URL, (font) => {
        const fontSize = 2;
        const shapes = font.generateShapes(text, fontSize);
        if (shapes.length === 0) {
            simulationData.targets.set(spherePositions);
            setIsProcessing(false);
            return;
        }
        const geometry = new THREE.ExtrudeGeometry(shapes, { depth: 1.5, bevelEnabled: true });
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox!;
        const xMid = -0.5 * (bbox.max.x - bbox.min.x);
        const yMid = -0.5 * (bbox.max.y - bbox.min.y);
        const zMid = -0.5 * (bbox.max.z - bbox.min.z);
        geometry.translate(xMid, yMid, zMid);
        
        const maxDim = Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y);
        // Normalize Scale Logic: We want to store "Unit" vectors (approx)
        const normalizeScale = 1 / (maxDim || 1);
        geometry.scale(normalizeScale, normalizeScale, normalizeScale);

        if (geometry.index) geometry.toNonIndexed();
        const posAttribute = geometry.attributes.position;
        const triangleCount = posAttribute.count / 3;
        
        if (triangleCount === 0) { geometry.dispose(); setIsProcessing(false); return; }

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

        // Cache normalized data
        const normTargets = new Float32Array(particleCount * 3);
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
            
            normTargets[i * 3] = tempTarget.x;
            normTargets[i * 3 + 1] = tempTarget.y;
            normTargets[i * 3 + 2] = tempTarget.z;
        }

        normalizedShapeRef.current.targets = normTargets;
        simulationData.zOffsets.fill(0); 
        
        // Initial Apply
        const currentTargets = simulationData.targets;
        const scale = (SPHERE_RADIUS * 2.2) * densityScale;
        for(let i=0; i<particleCount*3; i++) {
            currentTargets[i] = normTargets[i] * scale;
        }

        geometry.dispose();
        setIsProcessing(false);
    });
  }, [text, particleCount]); // removed densityScale dependency (handled by separate effect)

  // --- Dual Image Processing ---
  useEffect(() => {
    if (!imageXY && !imageYZ) return;
    
    setIsProcessing(true);

    const processImage = (src: string | null): Promise<any[]> => {
        return new Promise((resolve) => {
            if (!src) return resolve([]);
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxSize = 512; 
                let w = img.width; let h = img.height;
                if (w > h) { if (w > maxSize) { h *= maxSize / w; w = maxSize; } } 
                else { if (h > maxSize) { w *= maxSize / h; h = maxSize; } }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve([]);
                
                ctx.drawImage(img, 0, 0, w, h);
                const imgData = ctx.getImageData(0, 0, w, h);
                const data = imgData.data;
                const pixels = [];
                for (let y = 0; y < h; y += 2) {
                    for (let x = 0; x < w; x += 2) {
                        const index = (y * w + x) * 4;
                        if (data[index + 3] > 10) { 
                            pixels.push({
                                x: (x / w) - 0.5, y: 0.5 - (y / h), 
                                r: data[index]/255, g: data[index+1]/255, b: data[index+2]/255,
                            });
                        }
                    }
                }
                resolve(pixels);
            };
            img.onerror = () => resolve([]);
            img.src = src;
        });
    };

    Promise.all([processImage(imageXY), processImage(imageYZ)]).then(([pixelsXY, pixelsYZ]) => {
        const totalPixels = pixelsXY.length + pixelsYZ.length;
        if (totalPixels === 0) { setIsProcessing(false); return; }

        const normTargets = new Float32Array(particleCount * 3);
        const newColors = new Float32Array(particleCount * 3);
        const newOriginalColors = new Float32Array(particleCount * 3);
        const newZOffsets = new Float32Array(particleCount * 3); 
        
        const defaultColorRGB = new THREE.Color(color);
        const rotationEuler = new THREE.Euler(...canvasRotation);
        const tempVec = new THREE.Vector3();

        for(let i = 0; i < particleCount; i++) {
            const useXY = Math.random() < (pixelsXY.length / (totalPixels || 1));
            const sourcePool = useXY ? pixelsXY : pixelsYZ;
            
            if (sourcePool.length === 0) {
                 const fallback = useXY ? pixelsYZ : pixelsXY;
                 if (fallback.length === 0) continue;
            }
            const activeSource = (sourcePool.length > 0) ? sourcePool : (useXY ? pixelsYZ : pixelsXY);
            
            const pixel = activeSource.length > 0 
                ? activeSource[Math.floor(Math.random() * activeSource.length)]
                : { x:0, y:0, r:1, g:1, b:1 }; 

            const pX = pixel.x; // Normalized -0.5 to 0.5
            const pY = pixel.y; // Normalized -0.5 to 0.5

            if (useXY && sourcePool.length > 0) {
                tempVec.set(pX, pY, 0);
                newZOffsets[i*3] = 0; newZOffsets[i*3+1] = 0; newZOffsets[i*3+2] = 1; 
            } else {
                tempVec.set(0, pY, pX); 
                newZOffsets[i*3] = 1; newZOffsets[i*3+1] = 0; newZOffsets[i*3+2] = 0;
            }

            // Store normalized unit vector rotated
            tempVec.applyEuler(rotationEuler);
            
            const normal = new THREE.Vector3(newZOffsets[i*3], newZOffsets[i*3+1], newZOffsets[i*3+2]);
            normal.applyEuler(rotationEuler);
            newZOffsets[i*3] = normal.x; newZOffsets[i*3+1] = normal.y; newZOffsets[i*3+2] = normal.z;

            normTargets[i * 3] = tempVec.x; 
            normTargets[i * 3 + 1] = tempVec.y;
            normTargets[i * 3 + 2] = tempVec.z;

            newOriginalColors[i * 3] = pixel.r; newOriginalColors[i * 3 + 1] = pixel.g; newOriginalColors[i * 3 + 2] = pixel.b;
            if (useImageColors) { 
                newColors[i * 3] = pixel.r; newColors[i * 3 + 1] = pixel.g; newColors[i * 3 + 2] = pixel.b; 
            } else { 
                newColors[i * 3] = defaultColorRGB.r; newColors[i * 3 + 1] = defaultColorRGB.g; newColors[i * 3 + 2] = defaultColorRGB.b; 
            }
        }
        
        normalizedShapeRef.current.targets = normTargets;

        // Apply Initial Scale
        const currentTargets = simulationData.targets;
        const scale = (SPHERE_RADIUS * 2.0) * densityScale;
        for(let i=0; i<particleCount*3; i++) {
            currentTargets[i] = normTargets[i] * scale;
        }

        simulationData.colors.set(newColors);
        simulationData.zOffsets.set(newZOffsets);
        simulationData.originalColors.set(newOriginalColors);
        if (pointsRef.current) pointsRef.current.geometry.attributes.color.needsUpdate = true;
        
        setIsProcessing(false);

    });
    
  }, [imageXY, imageYZ, simulationData, particleCount, color, useImageColors, canvasRotation]); // Removed densityScale

  // --- Animation Loop ---
  useFrame((state) => {
    // Processing sırasında return etmiyoruz ki patlama (unmount) olmasın.
    // Ancak veri tam değilse (ilk yükleme) zaten targets 0 gelir veya eski data kalır, sorun yok.
    if (isDrawing || !pointsRef.current) return;

    let isAudioActive = audioMode !== 'none';
    let avgVolume = 0;

    if (isAudioActive && analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        let sum = 0;
        const len = dataArrayRef.current.length;
        for(let k=0; k < len; k++) { sum += dataArrayRef.current[k]; }
        avgVolume = sum / len;
        if (avgVolume < 5) isAudioActive = false;
    } else {
        isAudioActive = false;
    }

    const { current, targets, velocities, zOffsets } = simulationData;
    const positionsAttribute = pointsRef.current.geometry.attributes.position;
    const colorsAttribute = pointsRef.current.geometry.attributes.color;
    
    const pointer = state.pointer;
    const isInsideCanvas = Math.abs(pointer.x) <= 1.05 && Math.abs(pointer.y) <= 1.05;

    let hasInteractionTarget = false;
    const rayOrigin = new THREE.Vector3();
    const rayDir = new THREE.Vector3();

    if (isInsideCanvas && !disableMouseRepulsion && !isRightClicking.current && repulsionStrength > 0) {
        state.raycaster.setFromCamera(pointer, camera);
        // Interaction için sadece Ray'in Origin ve Direction'ını saklıyoruz
        rayOrigin.copy(state.raycaster.ray.origin);
        rayDir.copy(state.raycaster.ray.direction).normalize();
        hasInteractionTarget = true;
    }

    let springStrength = 0.05;
    let friction = 0.94;
    
    if (imageXY || imageYZ) { springStrength = 0.03; }
    if (isAudioActive) { springStrength = 0.15; friction = 0.80; }
    if (activePreset === 'water') { springStrength = 0.02; friction = 0.96; } 
    if (activePreset === 'electric') { springStrength = 0.1; friction = 0.85; }

    const dynamicRepulsionRadius = 1.0 + (repulsionRadius / 100) * 5.0; 
    const repulsionForce = (repulsionStrength / 50.0);
    const time = state.clock.elapsedTime;
    const bufferLength = dataArrayRef.current ? dataArrayRef.current.length : 1;

    // Reuse vectors to prevent GC
    const p = new THREE.Vector3();
    const vLine = new THREE.Vector3();
    const projected = new THREE.Vector3();
    const distVec = new THREE.Vector3();

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

      if (imageXY || imageYZ) {
          const nx = zOffsets[ix]; const ny = zOffsets[iy]; const nz = zOffsets[iz];
          const rnd = randomnessRef.current ? randomnessRef.current[i] : 0;
          const thickness = depthIntensity * 4.0; 
          tx += nx * rnd * thickness; ty += ny * rnd * thickness; tz += nz * rnd * thickness;
          
          if (isAudioActive && dataArrayRef.current) {
              const binIndex = i % (bufferLength / 2);
              const rawVal = dataArrayRef.current[binIndex] / 255.0;
              const audioSpike = rawVal * 4.0;
              tx += nx * audioSpike; ty += ny * audioSpike; tz += nz * audioSpike;
          }
      } else if (isAudioActive && dataArrayRef.current) {
         const binIndex = i % (bufferLength / 2);
         const rawVal = dataArrayRef.current[binIndex] / 255.0;
         const spike = rawVal * 3.0;
         const len = Math.sqrt(tx*tx + ty*ty + tz*tz) || 1;
         tx += (tx/len) * spike; ty += (ty/len) * spike; tz += (tz/len) * spike;
      }

      vx += (tx - px) * springStrength;
      vy += (ty - py) * springStrength;
      vz += (tz - pz) * springStrength;
      
      if (activePreset === 'fire') {
         const noise = Math.sin(px * 0.5 + time * 2) * Math.cos(pz * 0.5 + time);
         vy += 0.02 + noise * 0.01;
         if (py > 6) { current[iy] = -6; }
      }
      else if (activePreset === 'water') {
        vy += Math.sin(px + time) * 0.01;
      }
      else if (activePreset === 'electric') {
          vx += (Math.random() - 0.5) * 0.1; vy += (Math.random() - 0.5) * 0.1; vz += (Math.random() - 0.5) * 0.1;
      }

      if (hasInteractionTarget) {
        // --- NEW INTERACTION LOGIC: RAY-POINT DISTANCE ---
        // Calculate distance from Particle(P) to the Infinite Line defined by Ray(Origin, Direction)
        // Vector from RayOrigin to Particle
        p.set(px, py, pz);
        vLine.subVectors(p, rayOrigin);
        
        // Projection length of vLine onto RayDirection
        const t = vLine.dot(rayDir);
        
        // Closest point on the line to the particle
        projected.copy(rayOrigin).addScaledVector(rayDir, t);
        
        // Perpendicular distance vector (from line to particle)
        distVec.subVectors(p, projected);
        
        const distSq = distVec.lengthSq();
        const radiusSq = dynamicRepulsionRadius * dynamicRepulsionRadius;

        if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq);
            // Force decreases with distance from the ray core
            const forceFactor = (1 - dist / dynamicRepulsionRadius) * repulsionForce;
            
            // Push away from the line
            let nx = 0, ny = 0, nz = 0;
            if (dist > 0.0001) {
                nx = distVec.x / dist;
                ny = distVec.y / dist;
                nz = distVec.z / dist;
            } else {
                // If exactly on line (rare), push random
                nx = Math.random() - 0.5;
                ny = Math.random() - 0.5;
                nz = Math.random() - 0.5;
            }
            
            vx += nx * forceFactor;
            vy += ny * forceFactor;
            vz += nz * forceFactor;
        }
      }

      vx *= friction; vy *= friction; vz *= friction;
      
      current[ix] += vx; current[iy] += vy; current[iz] += vz;
      velocities[ix] = vx; velocities[iy] = vy; velocities[iz] = vz;

      positionsAttribute.setXYZ(i, current[ix], current[iy], current[iz]);
      
       if (isAudioActive || activePreset !== 'none') {
           let r=1, g=1, b=1;
           if (activePreset === 'none' && isAudioActive) {
               let freqValue = 0;
               if (dataArrayRef.current) freqValue = dataArrayRef.current[i % bufferLength] / 255.0;
               let baseR = simulationData.originalColors[ix] || 1;
               let baseG = simulationData.originalColors[iy] || 1;
               let baseB = simulationData.originalColors[iz] || 1;
               const intensity = freqValue * 1.5; 
               r = baseR + intensity * 0.6; g = baseG + intensity * 0.6; b = baseB + intensity * 0.6;
           } else if (activePreset === 'fire') {
               r = 1.0; g = Math.random() * 0.5; b = 0.0;
           } else if (activePreset === 'water') {
               r = 0.0; g = 0.5; b = 1.0;
           } else if (activePreset === 'electric') {
               const flicker = Math.random() > 0.9 ? 1.0 : 0.7;
               r = 0.6 * flicker; g = 0.9 * flicker; b = 1.0 * flicker;
           } else if (activePreset === 'disco') {
               const freq = 0.3;
               r = Math.sin(current[ix] * freq + time) * 0.5 + 0.5;
               g = Math.sin(current[iy] * freq + time + 2) * 0.5 + 0.5;
               b = Math.sin(current[iz] * freq + time + 4) * 0.5 + 0.5;
           } else {
               r = simulationData.originalColors[ix];
               g = simulationData.originalColors[iy];
               b = simulationData.originalColors[iz];
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
  
  if (isDrawing) return null;

  let computedSize = 0.01 + (particleSize / 100) * 0.2;
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