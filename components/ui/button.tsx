import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-widest cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-tango-yellow focus:ring-offset-1 focus:ring-offset-tango-black";
    const variants = {
      primary:
        "bg-tango-yellow text-tango-black border border-tango-yellow hover:bg-[#FFD000] font-extrabold",
      secondary:
        "border border-tango-border bg-transparent text-tango-muted hover:border-tango-white hover:text-tango-white",
      ghost:
        "bg-transparent text-tango-muted hover:text-tango-white",
      danger:
        "bg-tango-red text-tango-white border border-tango-red hover:bg-[#e02f2f]",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-[10px]",
      md: "px-5 py-2 text-[11px]",
      lg: "px-7 py-3 text-xs",
    };
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
