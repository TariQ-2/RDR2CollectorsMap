"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/i18n";

interface ConfirmDialogProps {
    id: string;
    open: boolean;
    onOpenChange: (v: boolean) => void;
    variant?: "danger" | "default";
    onConfirm: () => void;
}

export function ConfirmDialog({ id, open, onOpenChange, variant = "default", onConfirm }: ConfirmDialogProps) {
    const t = useTranslate();
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="items-center text-center">
                    <div className={cn("mb-2 flex h-14 w-14 items-center justify-center rounded-full", variant === "danger" ? "bg-destructive/10" : "bg-primary/10")}>
                        <AlertTriangle className={cn("h-7 w-7", variant === "danger" ? "text-destructive" : "text-primary")}/>
                    </div>

                    <DialogTitle className="w-full text-center text-lg">
                        {t(`${id}.title`)}
                    </DialogTitle>

                    <DialogDescription className="w-full pt-2 text-center leading-relaxed">
                        {t(`${id}.body`)}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex-row justify-center gap-2 pt-4 sm:justify-center">
                    <Button variant="outline" onClick={() => onOpenChange(false)} >
                        {t(`${id}.no`)}
                    </Button>

                    <Button variant={variant === "danger" ? "destructive" : "default"}
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        {t(`${id}.yes`)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
