"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  CameraControls,
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import type { Animal, Behavior, FocusSpec } from "@/animals/types";
import { AnimalRig } from "./AnimalRig";
import type { PoseMixer } from "@/lib/poseEngine";

/** Default framing used before any behaviour is picked. */
const HOME: FocusSpec = { distance: 2.55, yaw: 0.5, pitch: 0.17 };

interface RigInfo {
  mixer: PoseMixer;
  root: THREE.Object3D;
  radius: number;
}

/**
 * Turns a FocusSpec into camera + target world coordinates.
 * yaw 0 places the camera directly in front of the animal.
 */
function resolveLookAt(focus: FocusSpec, rig: RigInfo | null): [number, number, number, number, number, number] {
  const radius = rig?.radius ?? 1.4;
  // Body centre, roughly chest height for a seated quadruped.
  const target = new THREE.Vector3(0, radius * 0.72, 0);

  const bone = rig?.mixer.getBone(focus.bone);
  if (bone) {
    bone.updateWorldMatrix(true, false);
    const bonePos = bone.getWorldPosition(new THREE.Vector3());
    // Lean toward the bone rather than centring on it, so the body part is
    // emphasised without pushing the rest of the animal out of frame.
    target.lerp(bonePos, focus.bias ?? 0.6);
  }
  if (focus.offset) target.add(new THREE.Vector3(...focus.offset));

  const d = focus.distance * radius;
  const cp = Math.cos(focus.pitch);
  return [
    target.x + d * cp * Math.sin(focus.yaw),
    target.y + d * Math.sin(focus.pitch),
    target.z + d * cp * Math.cos(focus.yaw),
    target.x,
    target.y,
    target.z,
  ];
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex w-40 flex-col items-center gap-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs tracking-wide text-white/70">Loading model {Math.round(progress)}%</span>
      </div>
    </Html>
  );
}

function Scene({
  animal,
  behavior,
  onReady,
}: {
  animal: Animal;
  behavior: Behavior | null;
  onReady: () => void;
}) {
  const controls = useRef<CameraControls>(null!);
  const [rig, setRig] = useState<RigInfo | null>(null);

  const handleReady = useCallback(
    (info: RigInfo) => {
      setRig(info);
      onReady();
    },
    [onReady],
  );

  // Move the camera when the behaviour changes, then hand control back to the
  // user. Driving it every frame would fight their orbiting and jitter on the
  // wagging tail bone.
  useEffect(() => {
    if (!controls.current || !rig) return;
    const spec = behavior?.focus ?? HOME;
    const [px, py, pz, tx, ty, tz] = resolveLookAt(spec, rig);
    controls.current.setLookAt(px, py, pz, tx, ty, tz, true);
  }, [behavior, rig]);

  return (
    <>
      <CameraControls
        ref={controls}
        makeDefault
        smoothTime={0.55}
        minDistance={1.2}
        maxDistance={12}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2 + 0.12}
      />

      <ambientLight intensity={0.7} />
      <directionalLight
        position={[4.5, 7, 5]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      >
        <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 0.1, 24]} />
      </directionalLight>
      {/* Rim lights: the model is near-black, so edge separation does the work. */}
      <directionalLight position={[-5, 3.5, -3.5]} intensity={1.7} color="#7dd3fc" />
      <directionalLight position={[3, 1.6, -5]} intensity={1.2} color={animal.accent} />

      {/* Built from Lightformers rather than a remote HDRI, so it works offline. */}
      <Environment resolution={256}>
        <Lightformer intensity={2.2} position={[0, 4, -3]} scale={[9, 9, 1]} color="#ffffff" />
        <Lightformer intensity={1.1} position={[-4, 2, 3]} scale={[6, 6, 1]} color="#93c5fd" />
        <Lightformer intensity={0.9} position={[4, 1, 3]} scale={[6, 6, 1]} color={animal.accent} />
      </Environment>

      <Suspense fallback={<Loader />}>
        <AnimalRig animal={animal} behavior={behavior} onReady={handleReady} />
      </Suspense>

      <ContactShadows position={[0, 0.005, 0]} opacity={0.5} scale={11} blur={2.6} far={5} resolution={1024} />
    </>
  );
}

export function Viewport({ animal, behavior }: { animal: Animal; behavior: Behavior | null }) {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  if (!animal.model) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="glass max-w-sm rounded-2xl px-8 py-10 text-center">
          <div className="mb-3 text-5xl">{animal.icon}</div>
          <h3 className="text-lg font-semibold">{animal.name} is coming soon</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            The {animal.name.toLowerCase()} module is not available yet. Switch back to Dog to keep exploring.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="viewport-shell h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ position: [1.67, 1.6, 3.05], fov: 38, near: 0.1, far: 100 }}
      >
        <Scene animal={animal} behavior={behavior} onReady={onReady} />
      </Canvas>

      <div className={`viewport-hint ${ready ? "" : "opacity-0"}`}>
        <span>Drag to orbit</span>
        <span aria-hidden>·</span>
        <span>Scroll to zoom</span>
        <span aria-hidden>·</span>
        <span>Right-drag to pan</span>
      </div>
    </div>
  );
}
