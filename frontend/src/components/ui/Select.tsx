import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string; label: string }[];
    error?: string;
}

export function Select({ label, options, error, className, required, id, ...props }: SelectProps) {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label htmlFor={selectId} className="text-sm font-medium text-cal-text-primary">
                    {label}
                    {required && <span className="text-cal-error ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    id={selectId}
                    className={cn(
                        'cal-input w-full appearance-none pr-8',
                        error && 'border-cal-error',
                        className
                    )}
                    required={required}
                    {...props}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cal-text-muted pointer-events-none"
                />
            </div>
            {error && <p className="text-xs text-cal-error">{error}</p>}
        </div>
    );
}
