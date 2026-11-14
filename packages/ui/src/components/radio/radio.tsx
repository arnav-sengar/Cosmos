"use client";

import { forwardRef, useId } from "react";
import type { RadioProps } from "./radio.types";
import { useRadioGroupContext } from "./radio-group";
import styles from "./radio.module.css";

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      value,
      label,
      disabled = false,
      id,
      className,
      size,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const radioId = id ?? generatedId;

    const {
      name,
      value: selectedValue,
      onValueChange,
      disabled: groupDisabled,
      required,
      size: groupSize,
      describedBy,
    } = useRadioGroupContext();

    const radioClassNames = [
      styles.radio,
      styles[size ?? groupSize],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <label
        className={styles.option}
        htmlFor={radioId}
      >
        <input
          {...props}
          ref={ref}
          id={radioId}
          type="radio"
          name={name}
          value={value}
          checked={selectedValue === value}
          required={required}
          disabled={groupDisabled || disabled}
          className={radioClassNames}
          aria-describedby={describedBy}
          onChange={() => onValueChange(value)}
        />

        <span className={styles.label}>
          {label}
        </span>
      </label>
    );
  }
);

Radio.displayName = "Radio";
