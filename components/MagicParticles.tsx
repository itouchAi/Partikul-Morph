import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

const SPHERE_RADIUS = 4;
const FONT_URL = 'https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json';

type PresetType = 'none' | 'electric' | 'fire' | 'water' | 'mercury';

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
  activePreset
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera, gl } = useThree();
  
  const isHovered = useRef(false);
  const isRightClicking = useRef(false);
  
  const spherePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const vector = new THREE.Vector3();
    const spherical = new THREE.Spherical();

    for (let i = 0; i < particleCount; i++) {
      spherical.phi = Math.acos( -1 + ( 2 * i ) / particleCount );
      spherical.theta = Math.sqrt( particleCount * Math.PI ) * spherical.phi;
      
      vector.setFromSpherical(spherical).multiplyScalar(SPHERE_RADIUS);
      
      positions[i * 3] = vector.x;
      positions[i * 3 + 1] = vector.y;
      positions[i * 3 + 2] = vector.z;
    }
    return positions;
  }, [particleCount]);

  const simulationData = useMemo(() => {
    const current = new Float32Array(particleCount * 3);
    const targets = new Float32Array(particleCount * 3);
    
    current.set(spherePositions);
    targets.set(spherePositions);

    if (previousPositions && previousPositions.current) {
        const prev = previousPositions.current;
        const copyLength = Math.min(prev.length, current.length);
        for (let i = 0; i < copyLength; i++) {
            current[i] = prev[i];
        }
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
        const { velocities } = simulationData;
        const explodeForce = 2.0 + (repulsionStrength / 100) * 8.0; 
        
        // Elementlere göre patlama karakteristiği
        for (let i = 0; i < particleCount * 3; i++) {
            let mod = 1.0;
            if (activePreset === 'water') mod = 0.5; // Su daha ağır patlar
            if (activePreset === 'electric') mod = 1.5; // Elektrik daha şiddetli
            if (activePreset === 'mercury') mod = 0.3; // Civa çok az dağılır
            
            velocities[i] += (Math.random() - 0.5) * explodeForce * mod; 
        }
      }
    };

    const handlePointerUp = () => { isRightClicking.current = false; };
    const handlePointerEnter = () => { isHovered.current = true; };
    const handlePointerLeave = () => { isHovered.current = false; };

    gl.domElement.addEventListener('pointerdown', handlePointerDown);
    gl.domElement.addEventListener('pointerup', handlePointerUp);
    gl.domElement.addEventListener('pointerenter', handlePointerEnter);
    gl.domElement.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
      gl.domElement.removeEventListener('pointerup', handlePointerUp);
      gl.domElement.removeEventListener('pointerenter', handlePointerEnter);
      gl.domElement.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [gl.domElement, simulationData, disableMouseRepulsion, repulsionStrength, particleCount, activePreset]);

  // --- Reset / Init ---
  useEffect(() => {
    if (!text && !image) {
        simulationData.targets.set(spherePositions);
        simulationData.zOffsets.fill(0);
    }
  }, [text, image, spherePositions, simulationData]);

  // --- Color Management ---
  useEffect(() => {
    const { colors, originalColors } = simulationData;

    // Eğer preset aktifse, useFrame içinde renkler dinamik olarak yönetilir.
    // Ancak preset yoksa standart renklere dön.
    if (activePreset === 'none') {
        if (image && useImageColors) {
            colors.set(originalColors);
        } else {
            const c = new THREE.Color(color);
            for(let i=0; i<particleCount; i++) {
            colors[i*3] = c.r;
            colors[i*3+1] = c.g;
            colors[i*3+2] = c.b;
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
    if (image) return;
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

      const maxDim = Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y);
      const targetSize = SPHERE_RADIUS * 2.2; 
      const scaleFactor = targetSize / (maxDim || 1);
      geometry.scale(scaleFactor, scaleFactor, scaleFactor);

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
  }, [text, image, spherePositions, simulationData, particleCount]);

  // --- Image Processing ---
  useEffect(() => {
    if (!image) return;
    const img = new Image();
    img.src = image;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 256; 
        let w = img.width; let h = img.height;
        if (w > h) { if (w > maxSize) { h *= maxSize / w; w = maxSize; } } 
        else { if (h > maxSize) { w *= maxSize / h; h = maxSize; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const validPixels = [];
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const index = (y * w + x) * 4;
                if (data[index + 3] > 50) { 
                    validPixels.push({
                        x: (x / w) - 0.5, y: 0.5 - (y / h), 
                        r: data[index]/255, g: data[index+1]/255, b: data[index+2]/255,
                        luminance: (0.2126 * data[index] + 0.7152 * data[index+1] + 0.0722 * data[index+2]) / 255
                    });
                }
            }
        }
        if (validPixels.length === 0) return;
        const aspect = w / h;
        const targetScale = SPHERE_RADIUS * 2.0; 
        const newTargets = new Float32Array(particleCount * 3);
        const newColors = new Float32Array(particleCount * 3);
        const newOriginalColors = new Float32Array(particleCount * 3);
        const newZOffsets = new Float32Array(particleCount);
        const defaultColorRGB = new THREE.Color(color);

        for(let i = 0; i < particleCount; i++) {
            const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];
            const pX = pixel.x * targetScale;
            const pY = pixel.y * targetScale;
            if (aspect > 1) { newTargets[i * 3] = pX * aspect; newTargets[i * 3 + 1] = pY; } 
            else { newTargets[i * 3] = pX; newTargets[i * 3 + 1] = pY / aspect; }
            newZOffsets[i] = (pixel.luminance - 0.5); 
            newTargets[i * 3 + 2] = newZOffsets[i] * depthIntensity;
            newOriginalColors[i * 3] = pixel.r; newOriginalColors[i * 3 + 1] = pixel.g; newOriginalColors[i * 3 + 2] = pixel.b;
            if (useImageColors) { newColors[i * 3] = pixel.r; newColors[i * 3 + 1] = pixel.g; newColors[i * 3 + 2] = pixel.b; } 
            else { newColors[i * 3] = defaultColorRGB.r; newColors[i * 3 + 1] = defaultColorRGB.g; newColors[i * 3 + 2] = defaultColorRGB.b; }
        }
        simulationData.targets.set(newTargets);
        simulationData.colors.set(newColors);
        simulationData.zOffsets.set(newZOffsets);
        simulationData.originalColors.set(newOriginalColors);
        if (pointsRef.current) pointsRef.current.geometry.attributes.color.needsUpdate = true;
    };
  }, [image, simulationData, particleCount]);

  // --- Animation Loop ---
  useFrame((state) => {
    if (!pointsRef.current) return;

    const { current, targets, velocities, colors } = simulationData;
    const positionsAttribute = pointsRef.current.geometry.attributes.position;
    const colorsAttribute = pointsRef.current.geometry.attributes.color;
    
    const vector = new THREE.Vector3(state.mouse.x, state.mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distanceToOrigin = -camera.position.z / dir.z;
    const mouseWorldPos = camera.position.clone().add(dir.multiplyScalar(distanceToOrigin));

    // Presetlere göre fizik parametreleri
    let springStrength = 0.05;
    let friction = 0.94;
    
    if (activePreset === 'water') {
        springStrength = 0.02; // Daha gevşek
        friction = 0.96; // Daha az sürtünme, akışkan
    } else if (activePreset === 'mercury') {
        springStrength = 0.08; // Sıkı
        friction = 0.90; // Çok sürtünmeli, ağır
    } else if (activePreset === 'electric') {
        springStrength = 0.1; // Çok hızlı tepki
        friction = 0.85; // Enerjik
    }

    const dynamicRepulsionRadius = 1.0 + (repulsionRadius / 100) * 5.0; 
    const repulsionForce = (repulsionStrength / 50.0);
    const time = state.clock.elapsedTime;

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
      
      const tx = targets[ix];
      const ty = targets[iy];
      const tz = targets[iz];

      // Hedefe git
      vx += (tx - px) * springStrength;
      vy += (ty - py) * springStrength;
      vz += (tz - pz) * springStrength;

      // EFEKT ÖZEL HAREKETLERİ (Idle Motion)
      if (activePreset === 'fire') {
         // Isınan hava yükselir
         vy += 0.005 + Math.random() * 0.005; 
         vx += (Math.random() - 0.5) * 0.01;
      } 
      else if (activePreset === 'water') {
         // Dalgalanma
         vz += Math.sin(time * 2 + px * 0.5) * 0.002;
         vy += Math.cos(time * 1.5 + pz * 0.5) * 0.001;
      }
      else if (activePreset === 'electric') {
         // Titreme (Jitter)
         if (Math.random() > 0.95) {
             vx += (Math.random() - 0.5) * 0.2;
             vy += (Math.random() - 0.5) * 0.2;
             vz += (Math.random() - 0.5) * 0.2;
         }
      }

      // Mouse Etkileşimi
      if (isHovered.current && !disableMouseRepulsion && !isRightClicking.current && repulsionStrength > 0) {
        const dx = px - mouseWorldPos.x;
        const dy = py - mouseWorldPos.y;
        const dz = pz - mouseWorldPos.z;
        const distSq = dx*dx + dy*dy + dz*dz;

        if (distSq < dynamicRepulsionRadius * dynamicRepulsionRadius) {
            const dist = Math.sqrt(distSq);
            let force = (1 - dist / dynamicRepulsionRadius) * repulsionForce;
            
            // Efekt Bazlı Tepki
            if (activePreset === 'electric') {
                // Elektrik: Keskin, zikzaklı itme
                force *= 2.0;
                vx += (dx / dist) * force + (Math.random()-0.5) * force;
                vy += (dy / dist) * force + (Math.random()-0.5) * force;
                vz += (dz / dist) * force;
            } else if (activePreset === 'mercury') {
                // Civa: Yavaş ayrılır, birbirini çeker
                 force *= 0.5;
                 vx += (dx / dist) * force;
                 vy += (dy / dist) * force;
                 vz += (dz / dist) * force;
            } else {
                 vx += (dx / dist) * force;
                 vy += (dy / dist) * force;
                 vz += (dz / dist) * force;
            }
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

      // EFEKT RENKLENDİRMESİ
      if (activePreset !== 'none') {
          let r=1, g=1, b=1;
          
          if (activePreset === 'electric') {
              // Mavi/Beyaz çakmalar
              const isFlash = Math.random() > 0.98;
              if (isFlash) { r=1; g=1; b=1; } 
              else { r=0.1; g=0.5; b=1.0; } // Elektrik mavisi
          } 
          else if (activePreset === 'fire') {
              // Yüksekliğe göre Kırmızı -> Sarı
              // py (y pozisyonu) -4 ile 4 arası genelde
              const heightFactor = Math.min(1, Math.max(0, (py + 4) / 8));
              r = 1.0;
              g = heightFactor * 0.8; // Aşağısı kırmızı, yukarısı sarı
              b = 0.1;
          }
          else if (activePreset === 'water') {
              // Derinlik/Z'ye göre mavi tonları
              const depthFactor = Math.sin(time + px);
              r = 0.0;
              g = 0.5 + depthFactor * 0.2;
              b = 1.0;
          }
          else if (activePreset === 'mercury') {
              // Metalik gri/beyaz, hafif yansıma simülasyonu
              const shine = Math.abs(Math.sin(px * 2 + time));
              r = 0.6 + shine * 0.4;
              g = 0.6 + shine * 0.4;
              b = 0.7 + shine * 0.3;
          }
          colorsAttribute.setXYZ(i, r, g, b);
      }
    }

    positionsAttribute.needsUpdate = true;
    if (activePreset !== 'none') {
        colorsAttribute.needsUpdate = true;
    }

    if (previousPositions) {
        previousPositions.current = current;
    }
  });
  
  // Boyut hesaplama
  let computedSize = Math.max(0.01, 0.06 - (particleSpacing / 50) * 0.05);
  // Civa için biraz daha büyük tanecik
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
        blending={activePreset === 'fire' || activePreset === 'electric' ? THREE.AdditiveBlending : THREE.NormalBlending} 
        depthWrite={false}
      />
    </points>
  );
};