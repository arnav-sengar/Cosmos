import {
  createContext,
  useContext,
} from "react";

import type {
  TabsActivationMode,
  TabsOrientation,
} from "./tabs.types";

export interface TabsContextValue {
  value: string | undefined;
  firstTabValue: string | undefined;
  onValueChange: (value: string) => void;
  orientation: TabsOrientation;
  activationMode: TabsActivationMode;
  baseId: string;
}

export const TabsContext =
  createContext<TabsContextValue | null>(null);

export function useTabsContext() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error(
      "Tabs components must be used within a Tabs root."
    );
  }

  return context;
}
