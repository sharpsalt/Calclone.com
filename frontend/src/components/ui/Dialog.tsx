import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DialogProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    className?: string;
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === overlayRef.current) onClose();
            }}
        >
            <div
                className={cn(
                    'cal-card w-full max-w-md mx-4 p-6 shadow-[var(--shadow-cal)] animate-in zoom-in-95 duration-150',
                    className
                )}
            >
                {title && (
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-cal-text-primary">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-[var(--radius-cal-sm)] text-cal-text-muted hover:text-cal-text-primary hover:bg-cal-bg-subtle transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
