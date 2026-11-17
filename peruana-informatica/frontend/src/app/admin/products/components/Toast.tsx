"use client";

import React from "react";

import type { useProductsData } from '../hooks/useProductsData';

type Data = ReturnType<typeof useProductsData>;

export function Toast({ toast }: { toast: Data["toast"] }) {
  if (!toast) return null;


  return (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} flex items-center gap-2`}>
            <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
            <span>{toast.message}</span>
          </div>
  );
}
