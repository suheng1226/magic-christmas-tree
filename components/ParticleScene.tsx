import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { HandState, useStore, PhotoData } from '../store';

// Emojis for texture generation
const EMOJIS = ['❄️', '🎁', '🧦', '🔔', '🎅'];
const DECORATION_COUNT = 150; 
const CORE_PARTICLE_COUNT = 8000;
const GOLD_PARTICLE_COUNT = 400;
const LANTERN_COUNT = 10;
const SPIRAL_GOLD_COUNT = 100;

// Helper to create emoji textures
function createEmojiTexture(emoji: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = '90px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white'; 
    ctx.fillText(emoji, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// --- Optimization: Instanced Green Particles ---
const GreenParticlesInstanced: React.FC<{ handState: HandState }> = ({ handState }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = CORE_PARTICLE_COUNT;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Generate static data for each particle
    const data = useMemo(() => {
        return new Array(count).fill(0).map((_, i) => {
            // Tree Body Logic (Cone Volume)
            const height = 10;
            const baseRadius = 3.8;
            const y = -4 + Math.random() * height;
            const radiusAtY = ((6 - y) / height) * baseRadius;
            const r = Math.sqrt(Math.random()) * radiusAtY;
            const theta = Math.random() * Math.PI * 2;
            
            const treePos = new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));
            const currentPos = new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
            
            return {
                treePos,
                currentPos,
                angle: (i / count) * Math.PI * 2,
                speed: 1.5 + Math.random(),
                wobbleOffset: Math.random() * 100
            };
        });
    }, [count]);

    // Initialize Colors
    useLayoutEffect(() => {
        if (!meshRef.current) return;
        const greens = ['#10b981', '#34d399', '#6ee7b7', '#00ff9d', '#50c878'];
        const tempColor = new THREE.Color();
        for (let i = 0; i < count; i++) {
            tempColor.set(greens[Math.floor(Math.random() * greens.length)]);
            meshRef.current.setColorAt(i, tempColor);
        }
        meshRef.current.instanceColor!.needsUpdate = true;
    }, [count]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        const isPinch = handState === HandState.PINCH;
        const isClosed = handState === HandState.CLOSED;
        
        // Optimize: use loop instead of map
        for (let i = 0; i < count; i++) {
            const particle = data[i];
            
            let targetX = particle.treePos.x;
            let targetY = particle.treePos.y;
            let targetZ = particle.treePos.z;

            if (isClosed) {
                // Already set to treePos
            } else if (isPinch) {
                // Float gently
                targetX = particle.currentPos.x; // Keep X/Z roughly same
                targetZ = particle.currentPos.z;
                targetY = particle.currentPos.y + Math.sin(time + particle.wobbleOffset) * 0.005;
            } else {
                // Open / Unknown: Scatter
                const scatterRadius = 8;
                targetX = Math.cos(particle.angle + time * 0.1) * scatterRadius;
                targetZ = Math.sin(particle.angle + time * 0.1) * scatterRadius;
                targetY = particle.treePos.y + Math.sin(time + i) * 4;
            }

            // Lerp Logic
            const lerpFactor = isPinch ? 1.0 * delta : particle.speed * delta;
            
            particle.currentPos.x += (targetX - particle.currentPos.x) * lerpFactor;
            particle.currentPos.y += (targetY - particle.currentPos.y) * lerpFactor;
            particle.currentPos.z += (targetZ - particle.currentPos.z) * lerpFactor;

            dummy.position.set(particle.currentPos.x, particle.currentPos.y, particle.currentPos.z);
            
            // Subtle rotation
            dummy.rotation.set(time * 0.2 + i, time * 0.1, 0);
            
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[0.018, 5, 5]} />
            <meshStandardMaterial 
                emissive="#10b981"
                emissiveIntensity={0.5}
                roughness={0.2}
                toneMapped={false}
            />
        </instancedMesh>
    );
};

// --- Optimization: Gold Particles (Volume & Spiral) ---
const GoldParticlesInstanced: React.FC<{ 
    count: number; 
    type: 'volume' | 'spiral'; 
    handState: HandState 
}> = ({ count, type, handState }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const data = useMemo(() => {
        return new Array(count).fill(0).map((_, i) => {
            let spiralInfo = null;
            let treePos = new THREE.Vector3();

            if (type === 'volume') {
                const height = 10;
                const baseRadius = 3.9;
                const y = -4 + Math.random() * height;
                const radiusAtY = ((6 - y) / height) * baseRadius;
                const r = Math.sqrt(Math.random()) * radiusAtY;
                const theta = Math.random() * Math.PI * 2;
                treePos.set(r * Math.cos(theta), y, r * Math.sin(theta));
            } else {
                // Spiral
                const t = i / count;
                const height = 10;
                const y = 6 - (t * height);
                const radius = ((6 - y) / height) * 4.6;
                const rotations = 6;
                const theta = t * Math.PI * 2 * rotations + Math.PI; 
                spiralInfo = { y, radius, theta };
            }

            return {
                treePos, // Only used for volume
                spiralInfo, // Only used for spiral
                currentPos: new THREE.Vector3((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10),
                blinkSpeed: 2 + Math.random() * 5,
                angle: (i / count) * Math.PI * 2,
                offset: i
            };
        });
    }, [count, type]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        const isClosed = handState === HandState.CLOSED;
        const isPinch = handState === HandState.PINCH;

        for (let i = 0; i < count; i++) {
            const d = data[i];
            let tx=0, ty=0, tz=0;

            if (isClosed) {
                if (type === 'volume') {
                    tx = d.treePos.x; ty = d.treePos.y; tz = d.treePos.z;
                } else {
                    const spin = time * 0.2;
                    tx = d.spiralInfo!.radius * Math.cos(d.spiralInfo!.theta + spin);
                    tz = d.spiralInfo!.radius * Math.sin(d.spiralInfo!.theta + spin);
                    ty = d.spiralInfo!.y;
                }
            } else if (isPinch) {
                tx = d.currentPos.x;
                tz = d.currentPos.z;
                ty = d.currentPos.y + Math.sin(time + d.offset) * 0.005;
            } else {
                // Scatter
                const scatterRadius = 12;
                const angle = type === 'volume' ? d.angle : d.angle * 9; // Spread out more if spiral
                tx = Math.cos(angle + time * 0.15) * scatterRadius;
                tz = Math.sin(angle + time * 0.15) * scatterRadius;
                const baseY = type === 'volume' ? d.treePos.y : d.spiralInfo!.y;
                ty = baseY + Math.sin(time + i) * 4;
            }

            const lerpSpeed = isPinch ? 1.0 : 2.0;
            d.currentPos.x += (tx - d.currentPos.x) * lerpSpeed * delta;
            d.currentPos.y += (ty - d.currentPos.y) * lerpSpeed * delta;
            d.currentPos.z += (tz - d.currentPos.z) * lerpSpeed * delta;

            dummy.position.set(d.currentPos.x, d.currentPos.y, d.currentPos.z);
            
            // Blink effect via scaling
            const blink = 0.2 + Math.abs(Math.sin(time * d.blinkSpeed + d.offset));
            dummy.scale.setScalar(blink); 
            
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <circleGeometry args={[0.025, 8]} />
            <meshStandardMaterial 
                color="#FFD700"
                emissive="#FFD700"
                emissiveIntensity={2.0} 
                toneMapped={false}
                transparent
                roughness={0.1}
                side={THREE.DoubleSide}
            />
        </instancedMesh>
    );
};

// --- Optimization: Lanterns Instanced ---
const LanternsInstanced: React.FC<{ handState: HandState }> = ({ handState }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = LANTERN_COUNT;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const data = useMemo(() => {
        return new Array(count).fill(0).map((_, i) => {
            const t = i / count; 
            const height = 10;
            const y = 6 - (t * height); 
            const radius = ((6 - y) / height) * 4.8;
            const rotations = 6;
            const theta = t * Math.PI * 2 * rotations + 0.5;
            return {
                spiralInfo: { y, radius, theta },
                currentPos: new THREE.Vector3((Math.random()-0.5)*15, (Math.random()-0.5)*15, (Math.random()-0.5)*10),
                offset: i
            };
        });
    }, [count]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        const isClosed = handState === HandState.CLOSED;
        
        for (let i = 0; i < count; i++) {
            const d = data[i];
            let tx, ty, tz;

            if (isClosed) {
                const spin = time * 0.2;
                tx = d.spiralInfo.radius * Math.cos(d.spiralInfo.theta + spin);
                tz = d.spiralInfo.radius * Math.sin(d.spiralInfo.theta + spin);
                ty = d.spiralInfo.y;
            } else if (handState === HandState.PINCH) {
                tx = d.currentPos.x; tz = d.currentPos.z;
                ty = d.currentPos.y + Math.sin(time * 2 + d.offset) * 0.01;
            } else {
                const scatterRadius = 14;
                const theta = (d.offset / count) * Math.PI * 18;
                tx = Math.cos(theta + time * 0.4) * scatterRadius;
                tz = Math.sin(theta + time * 0.4) * scatterRadius;
                ty = d.spiralInfo.y + Math.sin(time + d.offset) * 6;
            }

            const lerp = handState === HandState.PINCH ? 1 : 1.5;
            d.currentPos.lerp(new THREE.Vector3(tx, ty, tz), delta * lerp);

            dummy.position.copy(d.currentPos);
            dummy.rotation.set(0, time + d.offset, Math.sin(time * 2 + d.offset) * 0.2);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <cylinderGeometry args={[0.15, 0.15, 0.3, 8]} />
            <meshStandardMaterial 
                color="#ff0000" 
                emissive="#ff0000"
                emissiveIntensity={2.0}
                toneMapped={false}
                roughness={0.2}
            />
        </instancedMesh>
    );
};

// --- Optimization: Decorations Instanced (Per Emoji) ---
const DecorationBatch: React.FC<{ 
    texture: THREE.Texture; 
    subsetCount: number; 
    globalOffset: number;
    totalCount: number;
    handState: HandState; 
}> = ({ texture, subsetCount, globalOffset, totalCount, handState }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const data = useMemo(() => {
        return new Array(subsetCount).fill(0).map((_, i) => {
            // Calculate true index in the spiral
            const trueIndex = globalOffset + i;
            const t = trueIndex / totalCount;
            const height = 10;
            const y = 6 - (t * height);
            const radius = ((6 - y) / height) * 4.5;
            const rotations = 6;
            const theta = t * Math.PI * 2 * rotations;
            
            return {
                spiralInfo: { y, radius, theta },
                currentPos: new THREE.Vector3((Math.random()-0.5)*15, (Math.random()-0.5)*15, (Math.random()-0.5)*10),
                trueIndex
            };
        });
    }, [subsetCount, globalOffset, totalCount]);

    // Randomize Colors for this batch
    useLayoutEffect(() => {
        if (!meshRef.current) return;
        const colors = ['#ff0000', '#00ff00', '#ffffff', '#FFD700', '#4287f5'];
        const tempColor = new THREE.Color();
        
        for (let i = 0; i < subsetCount; i++) {
             const randomColor = colors[Math.floor(Math.random() * colors.length)];
             tempColor.set(randomColor);
             meshRef.current.setColorAt(i, tempColor);
        }
        meshRef.current.instanceColor!.needsUpdate = true;
    }, [subsetCount]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        const isClosed = handState === HandState.CLOSED;

        for (let i = 0; i < subsetCount; i++) {
            const d = data[i];
            let tx, ty, tz;

            if (isClosed) {
                const spin = time * 0.2;
                tx = d.spiralInfo.radius * Math.cos(d.spiralInfo.theta + spin);
                tz = d.spiralInfo.radius * Math.sin(d.spiralInfo.theta + spin);
                ty = d.spiralInfo.y;
            } else if (handState === HandState.PINCH) {
                 tx = d.currentPos.x; tz = d.currentPos.z;
                 ty = d.currentPos.y + Math.sin(time * 2 + d.trueIndex) * 0.01;
            } else {
                const scatterRadius = 10;
                const theta = (d.trueIndex / totalCount) * Math.PI * 18;
                tx = Math.cos(theta + time * 0.5) * scatterRadius;
                tz = Math.sin(theta + time * 0.5) * scatterRadius;
                ty = d.spiralInfo.y + Math.sin(time + d.trueIndex) * 5;
            }

            const lerp = handState === HandState.PINCH ? 1 : 2.0;
            d.currentPos.lerp(new THREE.Vector3(tx, ty, tz), delta * lerp);

            dummy.position.copy(d.currentPos);
            dummy.lookAt(0, 0, 20); // Always face camera
            const scale = 0.5 + Math.sin(time * 3 + d.trueIndex) * 0.1;
            dummy.scale.setScalar(scale);
            
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, subsetCount]}>
            <planeGeometry args={[0.7, 0.7]} />
            <meshStandardMaterial 
                map={texture} 
                color="white" // Base white to allow instance colors to tint it
                transparent 
                alphaTest={0.5} 
                side={THREE.DoubleSide}
                metalness={0.6} 
                roughness={0.2}
                emissive="white"
                emissiveIntensity={0.5}
                toneMapped={false}
            />
        </instancedMesh>
    );
};

// --- Top Star (Keep as is) ---
const TopStar = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const starShape = useMemo(() => {
        const shape = new THREE.Shape();
        const points = 5;
        const outerRadius = 0.8;
        const innerRadius = 0.4;
        for (let i = 0; i < points * 2; i++) {
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2; 
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        return shape;
    }, []);

    const extrudeSettings = useMemo(() => ({
        depth: 0.2, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05, bevelSegments: 2
    }), []);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.5;
            meshRef.current.position.y = 6.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
    });

    return (
        <group>
            <mesh ref={meshRef} position={[0, 6.5, 0]}>
                <extrudeGeometry args={[starShape, extrudeSettings]} />
                <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} roughness={0.1} metalness={0.8} />
            </mesh>
            <pointLight position={[0, 6.5, 0]} color="#ffaa00" intensity={3} distance={10} decay={2} />
        </group>
    );
};

// --- Photo Component ---
const FloatingPhoto: React.FC<{ 
    photo: PhotoData; 
    isActive: boolean; 
    index: number; 
    totalCount: number;
    handState: HandState 
}> = ({ photo, isActive, index, totalCount, handState }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const texture = useMemo(() => new THREE.TextureLoader().load(photo.url), [photo.url]);
    const randomScatterPos = useMemo(() => {
         return new THREE.Vector3((Math.random()-0.5)*20, (Math.random()-0.5)*20, (Math.random()-0.5)*10);
    }, []);
    
    // Static random offsets for the "Lively Wall" to ensure stability per photo
    const wallOffsets = useMemo(() => ({
        x: (Math.random() - 0.5) * 1.5, // Random shift X
        y: (Math.random() - 0.5) * 1.5, // Random shift Y
        rotSpeed: (Math.random() - 0.5) * 0.5,
        rotOffset: Math.random() * Math.PI
    }), []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();

        // 1. PINCH: View Active Photo (Foreground)
        if (isActive && handState === HandState.PINCH) {
            const target = new THREE.Vector3(0, 0, 8); 
            meshRef.current.position.lerp(target, delta * 4);
            meshRef.current.rotation.set(0, 0, 0); 
            meshRef.current.scale.lerp(new THREE.Vector3(4, 4, 4), delta * 3); 
            return;
        }

        // Calculate Target Position based on State
        const targetPos = new THREE.Vector3();
        const targetScale = new THREE.Vector3(1.2, 1.2, 1.2);

        if (handState === HandState.CLOSED) {
            // --- Double Spiral Logic ---
            // Split into two groups: Even indices and Odd indices
            const isEven = index % 2 === 0;
            const spiralRadius = 5.5; 
            const heightRange = 10;
            const bottomY = -4;
            const pairIndex = Math.floor(index / 2);
            const totalPairs = Math.max(1, totalCount / 2);
            const t = pairIndex / totalPairs; 
            const y = bottomY + (t * heightRange);
            const speed = 0.2;
            const rotations = 4;
            const theta = t * Math.PI * 2 * rotations + (time * speed);

            if (isEven) {
                targetPos.set(spiralRadius * Math.cos(theta), y, spiralRadius * Math.sin(theta));
            } else {
                targetPos.set(spiralRadius * Math.cos(theta + Math.PI), y, spiralRadius * Math.sin(theta + Math.PI));
            }

        } else if (handState === HandState.OPEN) {
            // --- Lively Photo Wall Logic (Updated) ---
            // 5x Size (6.0)
            targetScale.set(6.0, 6.0, 6.0);

            // Grid Layout
            const cols = Math.ceil(Math.sqrt(totalCount));
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            // Increased spacing for larger photos
            const spacingX = 7.5;
            const spacingY = 7.2;
            
            const gridWidth = cols * spacingX;
            const gridHeight = Math.ceil(totalCount / cols) * spacingY;
            
            // Base Grid Position
            const xBase = (col * spacingX) - (gridWidth / 2) + (spacingX/2);
            const yBase = (row * spacingY) - (gridHeight / 2) + 1.5;

            // Add Life:
            // 1. Curve: Z moves back as X moves away from center (Cylindrical feel)
            const curveZ = Math.pow(xBase * 0.12, 2); 
            
            // 2. Wave: Gentle floating motion
            const waveY = Math.sin(time * 0.5 + xBase * 0.3) * 0.4;
            const waveX = Math.cos(time * 0.3 + yBase * 0.3) * 0.2;

            // 3. Randomness (Non-rigid)
            const looseX = wallOffsets.x;
            const looseY = wallOffsets.y;

            targetPos.set(
                xBase + looseX + waveX,
                yBase + looseY + waveY,
                -10 - curveZ // Push back slightly more to fit the massive wall
            );

        } else {
            // --- Unknown / Scatter ---
            targetPos.copy(randomScatterPos);
            targetPos.y += Math.sin(time + index) * 0.5;
        }

        // Apply Movement
        const lerpSpeed = handState === HandState.PINCH ? 4 : 2;
        meshRef.current.position.lerp(targetPos, delta * lerpSpeed);
        
        // Handle Rotation
        meshRef.current.lookAt(state.camera.position); 
        
        // Add lively tilt in OPEN state (Post-lookAt adjustment)
        if (handState === HandState.OPEN) {
             const tilt = Math.sin(time * wallOffsets.rotSpeed + wallOffsets.rotOffset) * 0.15;
             meshRef.current.rotateZ(tilt);
        }

        // Apply Scale
        if (handState === HandState.PINCH) {
             meshRef.current.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), delta * 2);
        } else {
            meshRef.current.scale.lerp(targetScale, delta * 2);
        }
    });

    return (
        <RoundedBox ref={meshRef} args={[1, 1, 0.05]} radius={0.05} smoothness={4}>
            <meshStandardMaterial map={texture} emissiveMap={texture} emissive="white" emissiveIntensity={isActive ? 0.6 : 0.25} toneMapped={true} roughness={0.8} />
        </RoundedBox>
    );
}

// --- Main Scene ---
const ParticleScene: React.FC = () => {
  const handState = useStore((state) => state.handState);
  const photos = useStore((state) => state.photos);
  const activePhotoId = useStore((state) => state.activePhotoId);
  const cycleNextPhoto = useStore((state) => state.cycleNextPhoto);
  const nextPhotoIndex = useStore((state) => state.nextPhotoIndex);
  const setActivePhotoId = useStore((state) => state.setActivePhotoId);

  // Pre-generate textures
  const textures = useMemo(() => EMOJIS.map(createEmojiTexture), []);
  // Removed colors array from here, moved into DecorationBatch for per-instance randomization

  // Split Decoration Count across emojis
  const decoPerType = Math.floor(DECORATION_COUNT / EMOJIS.length);

  useEffect(() => {
      if (handState === HandState.PINCH && photos.length > 0) {
          const photoToShow = photos[nextPhotoIndex];
          if (photoToShow) setActivePhotoId(photoToShow.id);
      } else {
          setActivePhotoId(null);
          if (handState !== HandState.PINCH && handState !== HandState.UNKNOWN && activePhotoId !== null) {
              cycleNextPhoto();
          }
      }
  }, [handState, photos, nextPhotoIndex, cycleNextPhoto, setActivePhotoId, activePhotoId]); 

  return (
    <group>
      {/* 1. Instanced Green Core */}
      <GreenParticlesInstanced handState={handState} />
      
      {/* 2. Instanced Volume Gold */}
      <GoldParticlesInstanced count={GOLD_PARTICLE_COUNT} type="volume" handState={handState} />

      {/* 3. Instanced Spiral Gold */}
      <GoldParticlesInstanced count={SPIRAL_GOLD_COUNT} type="spiral" handState={handState} />

      {/* 4. Instanced Lanterns */}
      <LanternsInstanced handState={handState} />

      {/* 5. Instanced Decorations (Batched by texture) */}
      {textures.map((tex, i) => (
          <DecorationBatch 
            key={`deco-batch-${i}`}
            texture={tex}
            subsetCount={decoPerType}
            globalOffset={i * decoPerType}
            totalCount={DECORATION_COUNT}
            handState={handState}
          />
      ))}

      {/* 6. Photos (Dynamic Positioning) */}
      {photos.map((photo, i) => (
          <FloatingPhoto 
            key={photo.id}
            photo={photo}
            index={i}
            totalCount={photos.length}
            isActive={photo.id === activePhotoId}
            handState={handState}
          />
      ))}

      {/* 7. Star */}
      <TopStar />

      <ambientLight intensity={0.3} />
    </group>
  );
};

export default ParticleScene;