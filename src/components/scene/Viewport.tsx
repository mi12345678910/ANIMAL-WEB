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
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import type { PoseMixer } from "@/lib/poseEngine";

/** Default framing used before any behaviour is picked. */
const HOME: FocusSpec = { distance: 2.55, yaw: 0.5, pitch: 0.17 };

interface RigInfo {
  mixer: PoseMixer;
  root: THREE.Object3D;
  radius: number;
  /** World-space centre of the animal — the default look-at point. */
  center: THREE.Vector3;
}

/**
 * Turns a FocusSpec into camera + target world coordinates.
 * yaw 0 places the camera directly in front of the animal.
 */
function resolveLookAt(focus: FocusSpec, rig: RigInfo | null): [number, number, number, number, number, number] {
  const radius = rig?.radius ?? 1.4;
  // Measured centre of the animal, so it lands mid-frame regardless of whether
  // the species is tall and compact or long and low.
  const target = rig ? rig.center.clone() : new THREE.Vector3(0, radius * 0.72, 0);

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
        <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--glass-border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Sits on the light stage, so use theme text rather than white. */}
        <span className="text-xs tracking-wide text-[var(--muted)]">
          Loading model {Math.round(progress)}%
        </span>
      </div>
    </Html>
  );
}

function Scene({
  animal,
  behavior,
  onReady,
  onModelError,
}: {
  animal: Animal;
  behavior: Behavior | null;
  onReady: () => void;
  onModelError: (error: Error) => void;
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

      {/*
        Neutral three-point setup. Everything stays white/near-white on purpose:
        an earlier pass used the species accent as a strong rim and tinted the
        cream chest fur green. Accent colour belongs in the UI, not on the model.

        Intensities are deliberately moderate — the previous values blew the
        light chest fur to pure white while the black back stayed unreadable.
      */}
      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#ffffff", "#b9c2d0", 0.55]} />

      {/* KEY: front-right and high. Defines form and casts the ground shadow. */}
      <directionalLight
        position={[4.5, 6.5, 5]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      >
        <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5, 0.1, 28]} />
      </directionalLight>

      {/* FILL: opposite the key, soft, no shadow — opens up the dark side. */}
      <directionalLight position={[-5, 2.5, 3.5]} intensity={0.95} color="#eef3fb" />

      {/* RIM / back light: separates the dark coat from the backdrop. */}
      <directionalLight position={[-2.5, 4, -5.5]} intensity={1.25} color="#ffffff" />

      {/* BOUNCE: low front, so chest, belly and legs don't crush to black. */}
      <directionalLight position={[0, -2, 4]} intensity={0.45} color="#ffffff" />

      {/* Built from Lightformers rather than a remote HDRI, so it works offline. */}
      <Environment resolution={256}>
        <Lightformer intensity={1.5} position={[0, 4, -3]} scale={[9, 9, 1]} color="#ffffff" />
        <Lightformer intensity={0.9} position={[-4, 2, 3]} scale={[6, 6, 1]} color="#f2f6ff" />
        <Lightformer intensity={0.7} position={[4, 1, 3]} scale={[6, 6, 1]} color="#ffffff" />
      </Environment>

      {/*
        Boundary OUTSIDE Suspense: a rejected model fetch throws on the retry
        render, which Suspense re-raises rather than handling.
      */}
      <ModelErrorBoundary onError={onModelError} resetKey={animal.model?.url ?? animal.id}>
        <Suspense fallback={<Loader />}>
          <AnimalRig animal={animal} behavior={behavior} onReady={handleReady} />
        </Suspense>
      </ModelErrorBoundary>

      <ContactShadows position={[0, 0.005, 0]} opacity={0.42} scale={11} blur={2.8} far={5} resolution={1024} />
    </>
  );
}

export function Viewport({ animal, behavior }: { animal: Animal; behavior: Behavior | null }) {
  const [ready, setReady] = useState(false);
  const [modelError, setModelError] = useState<Error | null>(null);
  const onReady = useCallback(() => setReady(true), []);
  const onModelError = useCallback((error: Error) => setModelError(error), []);

  // Clear a previous species' failure when switching animals.
  useEffect(() => {
    setModelError(null);
    setReady(false);
  }, [animal.id]);

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
      {/* Lit backdrop behind the transparent canvas — see globals.css. */}
      <div className="viewport-stage" aria-hidden />
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          // ACES crushes shadow detail on a dark coat; Neutral preserves it.
          // Exposure stays at 1.0 — lifting it blew out the cream chest fur.
          toneMapping: THREE.NeutralToneMapping,
          toneMappingExposure: 1.0,
        }}
        camera={{ position: [1.67, 1.6, 3.05], fov: 38, near: 0.1, far: 100 }}
      >
        <Scene
          animal={animal}
          behavior={behavior}
          onReady={onReady}
          onModelError={onModelError}
        />
      </Canvas>

      {modelError && (
        // z-10 clears the canvas, which globals.css puts at z-index 1.
        <div className="absolute inset-0 z-10 grid place-items-center p-6">
          <div className="surface-raised max-w-sm rounded-2xl px-6 py-6 text-center">
            <div className="mb-2 text-3xl">{animal.icon}</div>
            <h3 className="text-base font-semibold">
              The {animal.name.toLowerCase()} model didn&apos;t load
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              <code className="text-[0.78rem]">{animal.model?.url}</code> could not be
              fetched. If this is a deployed build, check that the file was committed —
              everything else on the page still works.
            </p>
          </div>
        </div>
      )}

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
