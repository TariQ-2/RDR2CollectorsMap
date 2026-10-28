"use client";
import type { ComponentType, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslate as useLanguageHooks } from '@/i18n';

const ROW       = "flex items-center justify-between gap-2 py-[5px] select-none";
const LABEL     = "text-[13px] leading-6 truncate cursor-pointer flex-1 min-w-0 text-start";
const CONTROL   = "h-[28px] min-w-30 w-28 shrink-0 flex items-center";
const INPUT     = "h-[28px] w-full text-[13px] rounded-[3px] px-2 bg-input/60 text-foreground border-0 outline-none";

export interface SelectOption {
    value: string;
    label?: string;
}

type BaseProps = {
    id?: string;
    label?: ReactNode;
    helpKey?: string;
    className?: string;
};

type ToggleProps = BaseProps & {
    type: "toggle";
    checked: boolean;
    onChange: (v: boolean) => void;
};

type SwitchProps = BaseProps & {
    type: "switch";
    value: number;
    onChange: (v: number) => void;
};

type TextProps = BaseProps & {
    type: "text";
    value: string;
    onChange: (v: string) => void;
    inputType?: string;
    accept?: string;
    placeholder?: string;
};

type NumberProps = BaseProps & {
    type: "number";
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
};

type SelectProps = BaseProps & {
    type: "select";
    value: string;
    onChange: (v: string) => void;
    options: ReadonlyArray<SelectOption>;
};

type ActionProps = BaseProps & {
    type: "action";
    onClick: () => void;
    disabled?: boolean;
    children?: ReactNode;
    variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null;
};

type CustomProps = BaseProps & {
    type: "custom";
    children: ReactNode;
};

type MenuProps = BaseProps & {
    type: "menu";
    icon?: ComponentType<{ className?: string }> | string;
    labelKey?: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    trailing?: ReactNode;
};

export function Row(props: ToggleProps | SwitchProps | TextProps | NumberProps | SelectProps | ActionProps | CustomProps | MenuProps) {
    const { id, label, helpKey, className } = props;
    const t = useLanguageHooks();
    const dataHelp = helpKey ?? (id ? `${id}.desc` : undefined);

    if (props.type === "menu") {
        const isInteractive = !props.disabled && !!props.onClick;
        const isComponentIcon = typeof props.icon !== "string";
        const labelText = props.label ?? t(props.labelKey ?? props.id ?? "");

        return (
            <div
                role={isInteractive ? "button" : undefined}
                tabIndex={isInteractive ? 0 : undefined}
                aria-disabled={props.disabled || undefined}
                aria-pressed={isInteractive ? props.active : undefined}
                onClick={isInteractive ? props.onClick : undefined}
                onKeyDown={
                    isInteractive ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            props.onClick?.();
                        }
                    } : undefined
                }
                data-help={dataHelp}
                className={cn(
                    "group flex items-center justify-between gap-2 px-2 py-1.5 rounded transition-colors",
                    props.active === false && "opacity-40",
                    isInteractive && "cursor-pointer hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    props.disabled && "cursor-not-allowed",
                    className,
                )}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {isComponentIcon && props.icon ? (
                        <props.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    ) : (
                        typeof props.icon === "string" && (
                            <img src={props.icon} alt="" aria-hidden="true" className="h-8 w-8 shrink-0 object-contain" />
                        )
                    )}
                    <span className="text-sm truncate" title={typeof labelText === 'string' ? labelText : undefined}>
                        {labelText}
                    </span>
                </div>
                {props.trailing && <div className="shrink-0">{props.trailing}</div>}
            </div>
        );
    }

    return (
        <div className={cn(ROW, className)} data-help={dataHelp}>
            <Label htmlFor={id} className={LABEL}>
                {t(`${label ? label : id}`)}
            </Label>

            <div className={CONTROL}>
                {props.type === "toggle" && (
                    <Switch id={id} checked={props.checked} onCheckedChange={props.onChange} className="ms-auto" />
                )}

                {props.type === "switch" && (
                    <Switch id={id} checked={props.value === 1} onCheckedChange={(v) => props.onChange(v ? 1 : 0)} className="ms-auto" />
                )}

                {props.type === "text" && (
                    <Input
                        id={id}
                        type={props.inputType ?? "text"}
                        accept={props.accept}
                        placeholder={props.placeholder}
                        value={props.value}
                        onChange={(e) => props.onChange(e.target.value)}
                        className={INPUT}
                    />
                )}

                {props.type === "number" && (
                    <Input
                        id={id}
                        type="number"
                        min={props.min}
                        max={props.max}
                        step={props.step}
                        value={props.value}
                        onChange={(e) => props.onChange(Number(e.target.value))}
                        className={INPUT}
                    />
                )}

                {props.type === "select" && (
                    <Select value={props.value} onValueChange={props.onChange}>
                        <SelectTrigger id={id} className={cn(INPUT, "justify-between")}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            align="end"
                            sideOffset={4}
                            className="max-h-62.5 overflow-y-auto w-(--radix-select-trigger-width)"
                        >
                            {props.options.map((o) => (
                                <SelectItem key={o.value} value={o.value} className="text-[13px] text-center">
                                    {t(`${o.label ? o.label : props.id + "." + o.value}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {props.type === "action" && (
                    <Button
                        id={id}
                        onClick={props.disabled ? undefined : props.onClick}
                        disabled={props.disabled}
                        className={cn(INPUT, "cursor-pointer transition-colors flex items-center justify-center hover:bg-accent/60", props.disabled && "opacity-40 cursor-not-allowed")}
                    >
                        {props.children ?? "›"}
                    </Button>
                )}

                {props.type === "custom" && props.children}
            </div>
        </div>
    );
}

export const ToggleRow  = (p: Omit<ToggleProps, "type">) => <Row type="toggle" {...p} />;
export const SwitchRow  = (p: Omit<SwitchProps, "type">) => <Row type="switch" {...p} />;
export const TextRow    = (p: Omit<TextProps, "type">) => <Row type="text" {...p} />;
export const NumberRow  = (p: Omit<NumberProps, "type">) => <Row type="number" {...p} />;
export const SelectRow  = (p: Omit<SelectProps, "type">) => <Row type="select" {...p} />;
export const ActionRow  = (p: Omit<ActionProps, "type">) => <Row type="action" {...p} />;

export function SettingDivider({ className }: { className?: string }) {
    return <Separator className={cn("my-1.5 opacity-0", className)} />;
}
