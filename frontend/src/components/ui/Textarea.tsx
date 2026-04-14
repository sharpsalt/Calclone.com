import { cn } from '../../lib/utils';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    variant?: 'dark' | 'light';
}

export function Textarea({ label, error, className, required, id, variant = 'dark', ...props }: TextareaProps) {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label htmlFor={textareaId} className="text-sm font-semibold text-cal-text-primary">
                    {label}
                    {required && <span className="text-cal-error ml-1">*</span>}
                </label>
            )}
            <textarea
                id={textareaId}
                className={cn(
                    'cal-input w-full min-h-[80px] resize-y',
                    error && 'border-cal-error!',
                    className
                )}
                required={required}
                {...props}
            />
            {error && <p className="text-xs text-cal-error mt-0.5">{error}</p>}
        </div>
    );
}
