import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ArchitecturalCanvas3DProps {
  onPropertySelect?: () => void;
  className?: string;
}

export const ArchitecturalCanvas3D: React.FC<ArchitecturalCanvas3DProps> = ({
  onPropertySelect,
  className,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGlError, setHasWebGlError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewAngle, setViewAngle] = useState<'day' | 'dusk'>('day');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Verify WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGlError(true);
        return;
      }
    } catch {
      setHasWebGlError(true);
      return;
    }

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to static imagery:', e);
      setHasWebGlError(true);
      return;
    }

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 420;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // Clear previous children and append canvas
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Create Scene
    const scene = new THREE.Scene();

    // Camera setup (Cinematic architectural 3/4 perspective)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    const targetCameraPos = new THREE.Vector3(6.5, 4.8, 7.5);
    camera.position.set(targetCameraPos.x + 2, targetCameraPos.y + 1, targetCameraPos.z + 2);
    const lookAtTarget = new THREE.Vector3(0, 0.8, 0);
    camera.lookAt(lookAtTarget);

    // =========================================================================
    // LIGHTING SYSTEM
    // =========================================================================
    const ambientLight = new THREE.AmbientLight(0xfaf9f6, 0.7);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe8f3ee, 0x1b4332, 0.45);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.4);
    sunLight.position.set(8, 12, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.camera.left = -6;
    sunLight.shadow.camera.right = 6;
    sunLight.shadow.camera.top = 6;
    sunLight.shadow.camera.bottom = -6;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Soft warm interior light illuminating the glass pavilion
    const interiorLight = new THREE.PointLight(0xffd8a8, 1.2, 8);
    interiorLight.position.set(0, 1.2, 0.2);
    scene.add(interiorLight);

    // =========================================================================
    // MATERIAL PALETTE (Warm Ivory, Forest Green, Sandstone, Glass, Teak)
    // =========================================================================
    const matConcrete = new THREE.MeshStandardMaterial({
      color: 0xf5f3ee,
      roughness: 0.8,
      metalness: 0.05,
    });

    const matPlinth = new THREE.MeshStandardMaterial({
      color: 0xe2ded4,
      roughness: 0.85,
      metalness: 0.05,
    });

    const matTimber = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.6,
      metalness: 0.1,
    });

    const matForestTrim = new THREE.MeshStandardMaterial({
      color: 0x1b4332,
      roughness: 0.4,
      metalness: 0.2,
    });

    const matDarkBronze = new THREE.MeshStandardMaterial({
      color: 0x242d27,
      roughness: 0.35,
      metalness: 0.6,
    });

    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0xaad3c4,
      transparent: true,
      opacity: 0.42,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.6,
      ior: 1.5,
    });

    const matWater = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.78,
    });

    const matFoliage = new THREE.MeshStandardMaterial({
      color: 0x245741,
      roughness: 0.85,
      metalness: 0.0,
    });

    const matTrunk = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9,
    });

    // Root architectural group
    const architectureGroup = new THREE.Group();
    scene.add(architectureGroup);

    // 1. Plinth / Ground Terrace Platform
    const plinthGeo = new THREE.BoxGeometry(6.6, 0.35, 6.6);
    const plinth = new THREE.Mesh(plinthGeo, matPlinth);
    plinth.position.y = -0.175;
    plinth.receiveShadow = true;
    architectureGroup.add(plinth);

    // 2. Reflecting Courtyard Pool
    const poolFrameGeo = new THREE.BoxGeometry(2.4, 0.15, 1.8);
    const poolFrame = new THREE.Mesh(poolFrameGeo, matPlinth);
    poolFrame.position.set(1.4, 0.06, 1.6);
    poolFrame.receiveShadow = true;
    architectureGroup.add(poolFrame);

    const waterGeo = new THREE.PlaneGeometry(2.1, 1.5, 8, 8);
    const water = new THREE.Mesh(waterGeo, matWater);
    water.rotation.x = -Math.PI / 2;
    water.position.set(1.4, 0.12, 1.6);
    architectureGroup.add(water);

    // 3. Ground Floor Main Residence Volume
    const groundFloorGeo = new THREE.BoxGeometry(3.6, 1.5, 3.2);
    const groundFloor = new THREE.Mesh(groundFloorGeo, matConcrete);
    groundFloor.position.set(-0.5, 0.75, -0.4);
    groundFloor.castShadow = true;
    groundFloor.receiveShadow = true;
    architectureGroup.add(groundFloor);

    // 4. Ground Floor Glass Facade Opening
    const glassFacadeGeo = new THREE.BoxGeometry(2.4, 1.25, 0.06);
    const glassFacade = new THREE.Mesh(glassFacadeGeo, matGlass);
    glassFacade.position.set(-0.5, 0.75, 1.22);
    architectureGroup.add(glassFacade);

    // Glass mullions (Architectural bronze frames)
    const mullionGeo = new THREE.BoxGeometry(0.04, 1.25, 0.08);
    for (let xOffset = -0.8; xOffset <= 0.8; xOffset += 0.8) {
      const mullion = new THREE.Mesh(mullionGeo, matDarkBronze);
      mullion.position.set(-0.5 + xOffset, 0.75, 1.23);
      architectureGroup.add(mullion);
    }

    // 5. Cantilevered Upper Architectural Pavilion
    const upperFloorGeo = new THREE.BoxGeometry(4.0, 1.4, 3.4);
    const upperFloor = new THREE.Mesh(upperFloorGeo, matConcrete);
    upperFloor.position.set(0.1, 2.15, 0.1);
    upperFloor.castShadow = true;
    upperFloor.receiveShadow = true;
    architectureGroup.add(upperFloor);

    // 6. Timber Louver Screen on Upper Cantilever
    const louverCount = 14;
    const louverWidth = 0.04;
    const louverHeight = 1.2;
    const louverDepth = 0.15;
    const louverGeo = new THREE.BoxGeometry(louverWidth, louverHeight, louverDepth);

    for (let i = 0; i < louverCount; i++) {
      const louver = new THREE.Mesh(louverGeo, matTimber);
      const xPos = 0.6 + i * 0.16;
      louver.position.set(xPos, 2.15, 1.82);
      louver.rotation.y = (Math.PI / 180) * 22; // subtle angle
      louver.castShadow = true;
      architectureGroup.add(louver);
    }

    // Upper Floor Ribbon Window
    const upperWindowGeo = new THREE.BoxGeometry(3.2, 0.8, 0.06);
    const upperWindow = new THREE.Mesh(upperWindowGeo, matGlass);
    upperWindow.position.set(-0.2, 2.2, 1.81);
    architectureGroup.add(upperWindow);

    // 7. Rooftop Terrace Pergola & Cantilever Roof
    const roofOverhangGeo = new THREE.BoxGeometry(4.4, 0.12, 3.8);
    const roofOverhang = new THREE.Mesh(roofOverhangGeo, matForestTrim);
    roofOverhang.position.set(0.1, 2.9, 0.1);
    roofOverhang.castShadow = true;
    architectureGroup.add(roofOverhang);

    // Architectural pergola slats
    const slatGeo = new THREE.BoxGeometry(1.6, 0.06, 0.08);
    for (let z = -0.6; z <= 0.6; z += 0.3) {
      const slat = new THREE.Mesh(slatGeo, matDarkBronze);
      slat.position.set(1.2, 3.1, z);
      architectureGroup.add(slat);
    }

    // 8. Landscaped Surroundings & Verifiable Architectural Greens
    // Courtyard Chinar / Cypress Tree
    const treeGroup = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.6, 8);
    const trunk = new THREE.Mesh(trunkGeo, matTrunk);
    trunk.position.y = 0.8;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const foliage1Geo = new THREE.ConeGeometry(0.75, 1.5, 8);
    const foliage1 = new THREE.Mesh(foliage1Geo, matFoliage);
    foliage1.position.y = 1.9;
    foliage1.castShadow = true;
    treeGroup.add(foliage1);

    const foliage2Geo = new THREE.ConeGeometry(0.55, 1.1, 8);
    const foliage2 = new THREE.Mesh(foliage2Geo, matFoliage);
    foliage2.position.y = 2.45;
    foliage2.castShadow = true;
    treeGroup.add(foliage2);

    treeGroup.position.set(-2.2, 0, 1.8);
    architectureGroup.add(treeGroup);

    // Secondary Garden Planter
    const planterGeo = new THREE.BoxGeometry(1.2, 0.3, 0.6);
    const planter = new THREE.Mesh(planterGeo, matConcrete);
    planter.position.set(-2.0, 0.15, -1.8);
    planter.receiveShadow = true;
    architectureGroup.add(planter);

    const hedgeGeo = new THREE.BoxGeometry(1.1, 0.45, 0.5);
    const hedge = new THREE.Mesh(hedgeGeo, matFoliage);
    hedge.position.set(-2.0, 0.45, -1.8);
    hedge.castShadow = true;
    architectureGroup.add(hedge);

    // Subtle floating verification badge mesh in the scene
    const badgeRingGeo = new THREE.TorusGeometry(0.35, 0.025, 16, 32);
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0x52b788,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0x1b4332,
      emissiveIntensity: 0.3,
    });
    const badgeRing = new THREE.Mesh(badgeRingGeo, badgeMat);
    badgeRing.position.set(2.4, 2.6, -1.2);
    architectureGroup.add(badgeRing);

    // =========================================================================
    // INTERACTION & CAMERA LERP CONTROLS
    // =========================================================================
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handlePointerMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      // Clamp bounds to prevent disorienting camera swing
      mouse.targetX = Math.max(-0.6, Math.min(0.6, normX));
      mouse.targetY = Math.max(-0.6, Math.min(0.6, normY));
    };

    const handlePointerLeave = () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
    };

    window.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mouseleave', handlePointerLeave);

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // =========================================================================
    // ANIMATION & RENDER LOOP
    // =========================================================================
    const startTime = performance.now();
    let initialEntranceProgress = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = (performance.now() - startTime) / 1000;

      // Smooth initial camera reveal entrance
      if (initialEntranceProgress < 1) {
        initialEntranceProgress += 0.015;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCameraPos.x, 0.04);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCameraPos.y, 0.04);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCameraPos.z, 0.04);
      } else {
        // Slow organic architectural drift
        const driftX = prefersReducedMotion ? 0 : Math.sin(elapsedTime * 0.25) * 0.12;
        const driftY = prefersReducedMotion ? 0 : Math.cos(elapsedTime * 0.2) * 0.08;

        // Smooth mouse parallax lerp
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        camera.position.x = targetCameraPos.x + mouse.x * 1.2 + driftX;
        camera.position.y = targetCameraPos.y + mouse.y * 0.8 + driftY;
        camera.position.z = targetCameraPos.z - mouse.x * 0.5;
      }

      camera.lookAt(lookAtTarget);

      // Subtle water reflection shimmer
      if (!prefersReducedMotion) {
        water.position.y = 0.12 + Math.sin(elapsedTime * 1.2) * 0.005;
        badgeRing.rotation.y = elapsedTime * 0.4;
      }

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    // Cleanup resources on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mouseleave', handlePointerLeave);
      resizeObserver.disconnect();

      // Traverse and dispose geometries and materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, [viewAngle]);

  // Fallback to static architectural photography if WebGL fails
  if (hasWebGlError) {
    return (
      <div className={`gs-hero-showcase ${className || ''}`}>
        <div className="gs-hero-showcase-inner">
          <img
            src="/images/hero_villa.jpg"
            alt="Authentic Verified Indian Residential Architecture"
            className="gs-hero-showcase-img"
          />
          <div className="gs-showcase-top-badge">
            <span>Title Clean • Registry Audited</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`gs-hero-showcase gs-3d-scene-wrapper ${className || ''}`}
      style={{
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(16, 38, 26, 0.22)',
        border: '1.5px solid rgba(82, 183, 136, 0.25)',
        background: 'radial-gradient(circle at 60% 40%, #153323 0%, #10261A 75%, #091A11 100%)',
        minHeight: '440px',
        height: '100%',
      }}
    >
      {/* 3D WebGL Canvas Mounting Point */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '440px',
          cursor: 'grab',
          position: 'relative',
          zIndex: 1,
        }}
      />

      {/* Top Controls Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          right: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: 'rgba(16, 38, 26, 0.88)',
            border: '1px solid rgba(82, 183, 136, 0.4)',
            backdropFilter: 'blur(8px)',
            color: '#DCFCE7',
            padding: '0.35rem 0.8rem',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            pointerEvents: 'auto',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#52B788',
              boxShadow: '0 0 8px #52B788',
              display: 'inline-block',
            }}
          />
          <span>Interactive 3D Architectural Model</span>
        </div>

        <button
          type="button"
          onClick={() => setViewAngle((prev) => (prev === 'day' ? 'dusk' : 'day'))}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            padding: '0.35rem 0.75rem',
            borderRadius: '8px',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            pointerEvents: 'auto',
            transition: 'all 0.2s',
          }}
          title="Toggle Lighting Mode"
        >
          {viewAngle === 'day' ? '☀️ Day Light' : '🌙 Dusk Ambient'}
        </button>
      </div>

      {/* Bottom Floating Dossier Card */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          right: '1rem',
          background: 'rgba(11, 27, 19, 0.92)',
          border: '1px solid var(--gs-border)',
          borderRadius: '16px',
          padding: '0.95rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.92rem',
              fontWeight: 800,
              color: 'var(--gs-text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            The Arya Pavilion • South Delhi
          </div>
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--gs-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginTop: '0.15rem',
            }}
          >
            <span style={{ color: 'var(--gs-accent-bright)', fontWeight: 700 }}>DORIS Verified Title</span>
            <span>• 3,200 sq.ft Cantilever Villa</span>
          </div>
        </div>

        {onPropertySelect && (
          <button
            type="button"
            onClick={onPropertySelect}
            className="gs-btn gs-btn-primary gs-btn-sm"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
          >
            <span>Explore</span>
          </button>
        )}
      </div>
    </div>
  );
};
