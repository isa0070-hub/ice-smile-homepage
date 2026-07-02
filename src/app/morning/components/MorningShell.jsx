"use client";

import { useEffect, useState } from "react";

export default function MorningShell({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let secondFrame;

    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        setReady(true);
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);

      if (secondFrame) {
        cancelAnimationFrame(secondFrame);
      }
    };
  }, []);

  return (
    <div
      id="morning-root"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        width: "100%",
        height: "100dvh",
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        overflow: "auto",
        background: "#f4f7fb",
        isolation: "isolate",
      }}
    >
      <div
        style={{
          width: "100%",
          minHeight: "100%",
          opacity: ready ? 1 : 0,
          transition: "opacity 180ms ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}