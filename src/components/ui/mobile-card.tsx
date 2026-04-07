import React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { GlassContainer } from "./glass-container";

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    onClick?: () => void;
    title?: string;
    subtitle?: string;
    thumbnail?: React.ReactNode;
    highlight?: boolean;
    action?: React.ReactNode;
}

export const MobileCard = React.forwardRef<HTMLDivElement, MobileCardProps>(
    ({ className, title, subtitle, thumbnail, highlight, action, children, onClick, ...props }, ref) => {
        return (
            <GlassContainer
                ref={ref}
                className={cn(
                    "relative overflow-hidden transition-all duration-300",
                    "active:scale-[0.98] active:bg-accent/10",
                    onClick && "cursor-pointer hover:bg-white/5",
                    highlight && "border-primary/50 bg-primary/5 shadow-[0_0_15px_-5px_rgba(var(--primary),0.3)]",
                    className
                )}
                onClick={onClick}
                {...props}
            >
                <div className="flex gap-4 p-4">
                    {/* Thumbnail / Icon area */}
                    {thumbnail && (
                        <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-muted/30 border border-white/10 flex items-center justify-center">
                            {thumbnail}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                {title && (
                                    <h3 className="font-bold text-base leading-tight truncate pr-2">
                                        {title}
                                    </h3>
                                )}
                                {subtitle && (
                                    <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                            {action && (
                                <div className="shrink-0">
                                    {action}
                                </div>
                            )}
                        </div>

                        {/* Body content if provided */}
                        {children && <div className="mt-2">{children}</div>}
                    </div>

                    {/* Chevron if clickable and no action? Or always if clickable? */}
                    {onClick && !action && (
                        <ChevronRight className="w-5 h-5 text-muted-foreground/50 self-center shrink-0" />
                    )}
                </div>

                {/* Highlight decorative bar */}
                {highlight && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
            </GlassContainer>
        );
    }
);
MobileCard.displayName = 'MobileCard';
