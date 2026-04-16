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
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center py-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === overlayRef.current) onClose();
            }}
        >
            <div
                className={cn(
                    'cal-card w-full mx-4 shadow-[var(--shadow-cal)] animate-in zoom-in-95 duration-150 overflow-hidden',
                    !className && 'max-w-md',
                    className
                )}
            >
                {title && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-cal-border">
                        <h2 className="text-lg font-semibold text-cal-text-primary">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-[var(--radius-cal-sm)] text-cal-text-muted hover:text-cal-text-primary hover:bg-cal-bg-subtle transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                <div className={cn('dialog-body overflow-auto max-h-[80vh] p-4 sm:p-6', !title ? 'pt-0' : '')}>
                    {children}
                </div>
            </div>
        </div>
    );
}
