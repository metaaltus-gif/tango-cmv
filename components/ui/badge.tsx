import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "yellow";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "border border-tango-border text-tango-muted",
    success: "border border-tango-yellow text-tango-yellow",
    warning: "border border-tango-yellow text-tango-yellow",
    danger: "border border-tango-red text-tango-red",
    info: "border border-tango-border text-tango-white",
    yellow: "bg-tango-yellow text-tango-black border border-tango-yellow",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 text-[9px] tg-mono uppercase tracking-widest font-bold",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
