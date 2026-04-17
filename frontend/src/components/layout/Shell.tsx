import type { ReactNode } from 'react';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

interface ShellProps {
    children: ReactNode;
    left?: ReactNode;
}

export function Shell({ children, left }: ShellProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-cal-bg-base">
            {left ?? <Sidebar />}

            {/* Mobile hamburger for pages that use the default sidebar (no left prop). */}
            {!left && (
                <button
                    aria-label="Open navigation"
                    onClick={() => setMobileOpen(true)}
                    className="lg:hidden fixed top-3 left-3 z-50 inline-flex items-center justify-center rounded-md border border-cal-border bg-cal-bg-surface p-2 text-cal-text-muted shadow-sm"
                >
                    <Menu size={18} />
                </button>
            )}

            {/* Mobile overlay */}
            {mobileOpen && !left && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
                    <Sidebar className="fixed inset-y-0 left-0 z-50 w-64 border-r border-cal-border bg-cal-bg-surface overflow-auto" />
                </div>
            )}

            <main className="min-w-0 flex-1 overflow-auto">
                <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
