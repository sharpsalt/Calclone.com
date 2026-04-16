import { useEffect, useMemo, useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Input } from './ui/Input';
import { useSearchStore } from '../stores/searchStore';
import { useNavigate } from 'react-router-dom';
import { defaultUser } from '../data/seed';
import { useEventTypeStore } from '../stores/eventTypeStore';

export function SearchModal() {
    const open = useSearchStore((s) => s.open);
    const setOpen = useSearchStore((s) => s.setOpen);
    const eventTypes = useEventTypeStore((s) => s.eventTypes);
    const [q, setQ] = useState('');
    // we focus the input by selecting it after open
    const navigate = useNavigate();

    useEffect(() => {
        if (open) {
            setTimeout(() => {
                const el = document.querySelector('input[placeholder="Type a command or search..."]') as HTMLInputElement | null;
                el?.focus();
            }, 50);
        } else {
            setQ('');
        }
    }, [open]);

    const items = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return eventTypes;
        return eventTypes.filter((et) => et.title.toLowerCase().includes(term) || et.slug.toLowerCase().includes(term));
    }, [q, eventTypes]);

    function onSelect(slug: string) {
        setOpen(false);
        navigate(`/${defaultUser.username}/${slug}`);
    }

    return (
        <Dialog open={open} onClose={() => setOpen(false)} title="">
            <div className="w-full">
                <Input placeholder="Type a command or search..." value={q} onChange={(e) => setQ(e.target.value)} />
                <div className="max-h-64 overflow-auto mt-3">
                    {items.map((it) => (
                        <button key={it.id} onClick={() => onSelect(it.slug)} className="w-full text-left px-3 py-2 rounded-md hover:bg-cal-bg-subtle">
                            {it.title}
                        </button>
                    ))}
                </div>
            </div>
        </Dialog>
    );
}
