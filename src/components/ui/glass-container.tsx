import React from "react";
import { cn } from "@/lib/utils";

interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    intensity?: "low" | "medium" | "high";
}

export const GlassContainer = React.forwardRef<HTMLDivElement, GlassContainerProps>(
    ({ children, className, intensity = "medium", ...props }, ref) => {
        const intensityClasses = {
            low: "bg-card/30 backdrop-blur-sm border-white/5",
            medium: "bg-card/50 backdrop-blur-md border-white/10",
            high: "bg-card/70 backdrop-blur-xl border-white/20",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-xl border shadow-lg transition-all",
                    intensityClasses[intensity],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
GlassContainer.displayName = "GlassContainer";
