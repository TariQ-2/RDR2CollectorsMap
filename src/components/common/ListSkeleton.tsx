"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ListSkeletonProps {
    rows?: number;
    showHeader?: boolean;
    className?: string;
}

export default function ListSkeleton({ rows = 6, showHeader = true, className }: ListSkeletonProps) {
    return (
        <div className={cn("py-1 space-y-1", className)} aria-hidden>
            {showHeader && (
                <div className="flex gap-2 px-1 border-b pb-1 mb-2">
                    <Skeleton className="h-8 flex-1 rounded" />
                    <Skeleton className="h-8 flex-1 rounded" />
                </div>
            )}

            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                    <Skeleton className="h-8 w-8 rounded shrink-0" />
                    <Skeleton className="h-4 rounded" style={{ width: `${55 + ((i * 13) % 30)}%` }}/>
                    <div className="ms-auto flex items-center gap-2 shrink-0">
                        <Skeleton className="h-3 w-8 rounded" />
                        <Skeleton className="h-3 w-12 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}
