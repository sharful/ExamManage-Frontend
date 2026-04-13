"use client";

import { useState, useEffect } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Module-level store — no context provider needed
let _toasts: Toast[] = [];
const _listeners = new Set<(toasts: Toast[]) => void>();

function notify() {
  _listeners.forEach((l) => l([..._toasts]));
}

export function toast(message: string, type: ToastType = "info") {
  const id = Math.random().toString(36).slice(2, 9);
  _toasts = [..._toasts, { id, message, type }];
  notify();
  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id);
    notify();
  }, 3500);
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
