"use client";

import { type TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  return (
    <div>
      {label ? (
        <label htmlFor={textareaId} className="label">
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn("input min-h-[80px] resize-y", error && "input-error", className)}
        {...rest}
      />
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
});
