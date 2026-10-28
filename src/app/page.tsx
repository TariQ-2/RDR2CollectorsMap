'use client';

import dynamic from 'next/dynamic';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SideMenu } from '@/components/SideMenu/SideMenu';
const MapContent = dynamic(
    () => import('@/components/map/MapContent'),
    { ssr: false },
);

const MapIndicators = dynamic(() => import('@/components/map/MapIndicators'), { ssr: false });
export default function HomePage() {
    return (
        <SidebarProvider style={{ "--sidebar-width": "390px", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}>
            <SideMenu variant="inset" className="bg-[#0000]" />
            <SidebarInset className="p-0 m-0 rounded">
                <MapContent />
                <MapIndicators />
            </SidebarInset>
        </SidebarProvider>
    );
}
