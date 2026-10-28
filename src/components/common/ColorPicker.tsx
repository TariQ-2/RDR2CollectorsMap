"use client";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ColorPickerItem {
  value: string;
  label?: string;
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  items?: Array<ColorPickerItem>;
  className?: string;
}

export function ColorPicker({ value, onChange, items, className }: ColorPickerProps) {
    const [color, setColor] = useState(value);
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
        setPrevValue(value);
        setColor(value);
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn("w-full justify-start gap-2 font-normal h-8 px-2 text-[13px] bg-background border-border hover:bg-accent/50", className)}
                >
                    <div className="h-4 w-4 rounded border border-border shrink-0" style={{ backgroundColor: color }} />
                    <span className="truncate">{color}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
                {items && items.length > 0 && (
                    <div className="grid grid-cols-8 gap-1.5 mb-3">
                        {items.map((item) => (
                            <Button
                                key={item.value}
                                title={item.label ?? item.value}
                                onClick={() => {
                                    setColor(item.value);
                                    onChange(item.value);
                                }}
                                className={cn(
                                    "h-5 w-5 rounded border transition-transform",
                                    "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    color === item.value && "ring-2 ring-primary ring-offset-1",
                                )}
                                style={{ backgroundColor: item.value }}
                            />
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Input
                        type="color"
                        value={color}
                        onChange={(e) => {
                            setColor(e.target.value);
                            onChange(e.target.value);
                        }}
                        className="h-7 w-10 p-1 cursor-pointer shrink-0"
                    />
                    <Input
                        type="text"
                        value={color}
                        onChange={(e) => {
                            setColor(e.target.value);
                            onChange(e.target.value);
                        }}
                        className="h-7 text-[13px] flex-1"
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}
