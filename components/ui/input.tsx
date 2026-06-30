import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "w-full bg-tango-charcoal border border-tango-border px-4 py-2.5 text-sm text-tango-white placeholder:text-tango-muted font-medium",
          "focus:outline-none focus:border-tango-yellow focus:ring-0 transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
