"use client";

import { useState, useEffect } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Auto-dismiss after this many ms. Defaults to 6000. Set to 0 to disable. */
  duration?: number;
  /** Show an X button to dismiss manually. Defaults to true. */
  dismissible?: boolean;
  /** Optional inline action (e.g. "Retry"). */
  action?: ToastAction;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  dismissible: boolean;
  action?: ToastAction;
}

const DEFAULT_DURATION_MS = 6000;

// Module-level store — no context provider needed
let _toasts: Toast[] = [];
const _listeners = new Set<(toasts: Toast[]) => void>();
const _timers = new Map<string, ReturnType<typeof setTimeout>>();

function notify() {
  _listeners.forEach((l) => l([..._toasts]));
}

function scheduleDismissal(id: string, duration: number) {
  if (duration <= 0) return;
  const existing = _timers.get(id);
  if (existing) clearTimeout(existing);
  _timers.set(
    id,
    setTimeout(() => {
      dismissToast(id);
    }, duration),
  );
}

export function dismissToast(id: string) {
  const timer = _timers.get(id);
  if (timer) {
    clearTimeout(timer);
    _timers.delete(id);
  }
  _toasts = _toasts.filter((t) => t.id !== id);
  notify();
}

export function pauseToast(id: string) {
  const timer = _timers.get(id);
  if (timer) {
    clearTimeout(timer);
    _timers.delete(id);
  }
}

export function resumeToast(id: string) {
  const t = _toasts.find((x) => x.id === id);
  if (!t) return;
  scheduleDismissal(id, t.duration);
}

export function toast(
  message: string,
  type: ToastType = "info",
  options: ToastOptions = {},
) {
  const id = Math.random().toString(36).slice(2, 9);
  const duration = options.duration ?? DEFAULT_DURATION_MS;
  const dismissible = options.dismissible ?? true;
  _toasts = [
    ..._toasts,
    { id, message, type, duration, dismissible, action: options.action },
  ];
  notify();
  scheduleDismissal(id, duration);
  return id;
}

export function useToastStore(): Toast[] {
  const [toasts, setToasts] = useState<Toast[]>([..._toasts]);

  useEffect(() => {
    _listeners.add(setToasts);
    return () => {
      _listeners.delete(setToasts);
    };
  }, []);

  return toasts;
}
