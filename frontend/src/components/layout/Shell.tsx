import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface ShellProps {
    children: ReactNode;
}

export function Shell({ children }: ShellProps) {
    return (
        <div className="flex min-h-screen bg-cal-bg-base">
            <Sidebar />
            <main className="min-w-0 flex-1 overflow-auto">
                <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
