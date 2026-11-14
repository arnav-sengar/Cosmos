import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

interface AccordionBaseProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "children" | "onChange"
  > {
  disabled?: boolean;
  children: ReactNode;
}

export interface AccordionSingleProps
  extends AccordionBaseProps {
  type: "single";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string | undefined) => void;
  collapsible?: boolean;
}

export interface AccordionMultipleProps
  extends AccordionBaseProps {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  collapsible?: never;
}

export type AccordionProps =
  | AccordionSingleProps
  | AccordionMultipleProps;

export interface AccordionItemProps
  extends ComponentPropsWithoutRef<"div"> {
  value: string;
  disabled?: boolean;
  children: ReactNode;
}

export interface AccordionTriggerProps
  extends Omit<
    ComponentPropsWithoutRef<"button">,
    "type"
  > {
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
}

export interface AccordionContentProps
  extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}
