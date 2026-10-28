"use client";
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
    title: string;
    as?: ElementType;
    children?: ReactNode;
    className?: string;
}

export default function SectionHeader({ title, as: Tag = "h2", children, className }: SectionHeaderProps) {
    return (
        <div>
            <div className={cn("flex items-center gap-3 py-3", className)}>
                <span className="h-px flex-1 bg-border" aria-hidden />
                <Tag className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                    {title}
                </Tag>
                <span className="h-px flex-1 bg-border" aria-hidden />
            </div>
            {children &&
                <div className="space-y-1 px-1">
                    {children}
                </div>
            }
        </div>
    );
}
