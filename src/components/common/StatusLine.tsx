"use client";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionStatus = "idle" | "loading" | "success" | "error";

interface StatusLineProps {
    status: ActionStatus;
    message: string;
    className?: string;
}

export default function StatusLine({ status, message, className }: StatusLineProps) {
    if (status === "idle" || !message) {
        return null;
    }

    const isSuccess = status === "success";
    const isError   = status === "error";
    const isLoading = status === "loading";

    return (
        <div
            role={isError ? "alert" : "status"}
            aria-live={isError ? "assertive" : "polite"}
            className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-[11px]",
                isSuccess && "text-success",
                isError && "text-destructive",
                isLoading && "text-muted-foreground",
                className,
            )}
        >
            {isSuccess && <CheckCircle2 className="h-3 w-3" />}
            {isError && <AlertTriangle className="h-3 w-3" />}
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            {message}
        </div>
    );
}
