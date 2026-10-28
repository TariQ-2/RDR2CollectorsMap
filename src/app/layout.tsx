import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SidebarProvider } from "@/components/ui/sidebar";
import ThemeApplier from "@/components/ThemeApplier";
import { THEME_BOOT_SCRIPT } from "@/features/settings/themes";
import { LANGUAGE_BOOT_SCRIPT } from "@/i18n";

export const metadata: Metadata = {
    title: "Red Dead Online - Collectors Map",
    description: "Red Dead Online Collectors Map. Find all collectibles across the world and sell to Madam Nazar.",
    keywords: ["Red Dead Online", "Collectors Map", "Map", "Interactive Map"],
    icons: {
        icon: [
            { url: "/RDR2CollectorsMap/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/RDR2CollectorsMap/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        ],
        apple: "/apple-touch-icon.png",
        shortcut: "/favicon.ico",
    },
    manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#141210",
};

export default function RootLayout({ children }: { children: React.ReactNode}) {
    return (
        <html lang="en" dir="ltr" className="rdo-ui" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: LANGUAGE_BOOT_SCRIPT }}/>
                <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
            </head>
            <body className="select-none">
                <Providers>
                    <SidebarProvider defaultOpen={true}>
                        <ThemeApplier />
                        {children}
                    </SidebarProvider>
                </Providers>
            </body>
        </html>
    );
}
