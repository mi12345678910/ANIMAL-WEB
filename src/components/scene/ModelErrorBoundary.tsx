"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches a failure to load or set up the 3D model.
 *
 * `Suspense` only handles the *pending* promise — when `useGLTF`'s fetch
 * rejects (a 404 on the .glb, a corrupt file, a missing Draco decoder) the
 * error is thrown during render and sails straight past it. With no boundary in
 * the tree it reached the React root and Next.js replaced the whole page with
 * "Application error: a client-side exception has occurred", losing the header,
 * the behaviour list and the chat along with the viewport.
 *
 * That is exactly what a deployment missing `cat.glb` and `horse.glb` looked
 * like: one absent asset blanked the entire app, and the generic message gave
 * no hint which file was at fault.
 *
 * This renders `null` in the 3D tree — a DOM fallback is impossible inside a
 * canvas — and reports upward so the viewport can draw a real message beside
 * it. The rest of the app keeps working, so the user can switch species.
 */
interface Props {
  children: ReactNode;
  onError: (error: Error) => void;
  /** Remounts the boundary when the model changes, clearing a previous error. */
  resetKey: string;
}

interface State {
  failed: boolean;
}

export class ModelErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  componentDidCatch(error: Error) {
    console.error("[viewport] model failed to load:", error);
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
