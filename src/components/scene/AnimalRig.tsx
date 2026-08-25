"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Animal, Behavior } from "@/animals/types";
import { PoseMixer } from "@/lib/poseEngine";

useGLTF.setDecoderPath("/draco/");

interface Props {
  animal: Animal;
  behavior: Behavior | null;
  onReady?: (info: { mixer: PoseMixer; root: THREE.Object3D; radius: number }) => void;
}

/**
 * Bounding radius of the animal, in the root's own space.
 *
 * `Box3.setFromObject` is WRONG for skinned meshes: it multiplies the geometry
 * AABB by the mesh node's `matrixWorld`. glTF deliberately ignores that node
 * transform for skinned meshes — the joint matrices (geometry's inverse-bind
 * times the joint's global transform) place the vertices instead. On a rig
 * exported under a scaled parent, those two disagree by exactly that scale, and
 * the camera then frames something 100x the wrong size.
 *
 * Measuring the skeleton avoids the whole problem: bone world positions are
 * always correct, and the padding accounts for bones sitting inside the
 * silhouette rather than on it.
 */
function measureRadius(root: THREE.Object3D): number {
  const bones: THREE.Bone[] = [];
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones.push(o as THREE.Bone);
  });

  const box = new THREE.Box3();

  if (bones.length > 0) {
    // Work in root-local space so a scaled ancestor is not counted twice.
    root.updateWorldMatrix(false, true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const p = new THREE.Vector3();
    for (const bone of bones) {
      p.setFromMatrixPosition(bone.matrixWorld).applyMatrix4(inv);
      box.expandByPoint(p);
    }
    const size = box.getSize(new THREE.Vector3());
    box.expandByVector(size.multiplyScalar(0.12));
  } else {
    box.setFromObject(root);
  }

  return box.getBoundingSphere(new THREE.Sphere()).radius;
}

/**
 * Loads the species model and drives its skeleton.
 *
 * Two animation sources are supported so that hand-animated and rig-driven
 * models can share one interface:
 *   1. If the behaviour names a `clip` and the GLB actually contains it, that
 *      baked AnimationClip is played.
 *   2. Otherwise the procedural PoseMixer drives the bones from the behaviour's
 *      pose + oscillators.
 * The dog model ships unanimated, so it takes path 2.
 */
export function AnimalRig({ animal, behavior, onReady }: Props) {
  const spec = animal.model!;
  const { scene, animations } = useGLTF(spec.url);

  // Clone so remounting (or two viewports) never share mutated bone state.
  //
  // This MUST be SkeletonUtils.clone, not Object3D.clone(): the latter copies a
  // SkinnedMesh by reference to the *original* skeleton, so the cloned bones we
  // then rotate deform nothing and the model sits frozen in its bind pose.
  // SkeletonUtils rebinds each cloned mesh to the cloned bone hierarchy.
  const root = useMemo(() => {
    const clone = cloneSkinned(scene);
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
      }
    });
    return clone;
  }, [scene]);

  const groupRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, root);
  const mixerRef = useRef<PoseMixer | null>(null);
  const activeClip = useRef<THREE.AnimationAction | null>(null);

  useLayoutEffect(() => {
    const mixer = new PoseMixer(root, animal.idle);
    mixerRef.current = mixer;

    onReady?.({ mixer, root, radius: measureRadius(root) * spec.scale });

    return () => {
      mixerRef.current = null;
    };
  }, [root, animal.idle, spec.scale, onReady]);

  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer) return;

    // Stop any baked clip from the previous behaviour.
    if (activeClip.current) {
      activeClip.current.fadeOut(0.3);
      activeClip.current = null;
    }

    const clipName = behavior?.clip;
    const bakedAction = clipName ? actions[clipName] : undefined;

    if (bakedAction) {
      // Model ships with a real animation for this behaviour: use it.
      mixer.setBehavior(null);
      bakedAction.reset().fadeIn(0.3).play();
      activeClip.current = bakedAction;
    } else {
      mixer.setBehavior(behavior);
    }
  }, [behavior, actions]);

  useFrame((_, delta) => {
    // Clamp delta so a backgrounded tab does not fast-forward the oscillators.
    mixerRef.current?.update(Math.min(delta, 0.05));
  });

  return (
    <group ref={groupRef} rotation={[0, spec.faceYaw, 0]} position={[0, spec.yOffset, 0]} scale={spec.scale}>
      <primitive object={root} />
    </group>
  );
}
