import {
  createContext,
  useContext,
} from "react";

export type AccordionType = "single" | "multiple";

export interface AccordionContextValue {
  type: AccordionType;
  value: string[];
  disabled: boolean;
  collapsible: boolean;
  baseId: string;
  onItemToggle: (itemValue: string) => void;
}

export interface AccordionItemContextValue {
  value: string;
  disabled: boolean;
  triggerId: string;
  contentId: string;
}

export const AccordionContext =
  createContext<AccordionContextValue | null>(null);

export const AccordionItemContext =
  createContext<AccordionItemContextValue | null>(null);

export function useAccordionContext() {
  const context = useContext(AccordionContext);

  if (!context) {
    throw new Error(
      "Accordion components must be used within an Accordion root."
    );
  }

  return context;
}

export function useAccordionItemContext() {
  const context = useContext(AccordionItemContext);

  if (!context) {
    throw new Error(
      "AccordionTrigger and AccordionContent must be used within an AccordionItem."
    );
  }

  return context;
}
