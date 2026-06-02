"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "16px",
          background: "#0f172a",
          color: "#f8fafc",
          padding: "12px 16px",
          fontSize: "14px",
        },
        success: {
          style: {
            background: "#065f46",
            color: "#ecfdf5",
          },
        },
        error: {
          style: {
            background: "#7f1d1d",
            color: "#fef2f2",
          },
        },
      }}
    />
  );
}
