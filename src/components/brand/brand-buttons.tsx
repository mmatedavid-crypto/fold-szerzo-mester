import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type BrandButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary";
};

export const BrandButton = React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ asChild = false, variant = "primary", className, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex min-h-11 items-center justify-center rounded-md border-2 px-5 py-2.5 text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-df-yellow disabled:pointer-events-none disabled:opacity-60",
          variant === "primary"
            ? "border-df-green bg-df-green text-df-card shadow-[3px_3px_0_var(--df-border)] hover:bg-df-ink"
            : "border-df-green bg-df-card text-df-green shadow-[3px_3px_0_var(--df-border)] hover:bg-df-cream",
          className,
        )}
        {...props}
      />
    );
  },
);

BrandButton.displayName = "BrandButton";
