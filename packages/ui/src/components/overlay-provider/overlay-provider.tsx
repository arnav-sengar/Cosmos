"use client";

import {
  useCallback,
  useState,
} from "react";

import { OverlayPortalContext } from "../../internal/overlay-portal-context";
import type { OverlayProviderProps } from "./overlay-provider.types";
import styles from "./overlay-provider.module.css";

export function OverlayProvider({
  children,
}: OverlayProviderProps) {
  const [portalRoot, setPortalRoot] =
    useState<HTMLDivElement | null>(null);

  const handlePortalRef = useCallback(
    (node: HTMLDivElement | null) => {
      setPortalRoot(node);
    },
    []
  );

  return (
    <OverlayPortalContext.Provider value={portalRoot}>
      {children}

      <div
        ref={handlePortalRef}
        className={styles.portalRoot}
        data-overlay-portal-root
      />
    </OverlayPortalContext.Provider>
  );
}