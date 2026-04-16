import { useEffect, useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { getInitials } from '../lib/utils';
import { defaultUser } from '../data/seed';

export function GreetingModal() {
    const [open, setOpen] = useState(false);
    const [reply, setReply] = useState('');

    useEffect(() => {
        try {
            const seen = localStorage.getItem('greetingSeen');
            if (seen === 'true') return;
        } catch (e) {
            // ignore storage errors
        }

        // Don't show the greeting on the public profile/booking pages
        // (these routes are `/${username}` or `/${username}/:slug`).
        try {
            const pathname = window.location.pathname || '';
            if (pathname === `/${defaultUser.username}` || pathname.startsWith(`/${defaultUser.username}/`)) {
                return;
            }
        } catch (e) {
            // ignore
        }

        // show shortly after mount
        const t = setTimeout(() => setOpen(true), 120);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        function handler() {
            setOpen(true);
        }
        document.addEventListener('showGreeting', handler as EventListener);
        return () => document.removeEventListener('showGreeting', handler as EventListener);
    }, []);

    function close(dontShowAgain = true) {
        try {
            if (dontShowAgain) localStorage.setItem('greetingSeen', 'true');
        } catch (e) {}
        setOpen(false);
    }

    function sendReply() {
        try {
            localStorage.setItem('greetingReply', reply || '');
            localStorage.setItem('greetingSeen', 'true');
        } catch (e) {}
        setOpen(false);
    }

    return (
        <Dialog open={open} onClose={() => close(true)} title="Peer from Cal.com, Inc.">
            <div className="flex gap-4 items-start">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {getInitials(defaultUser.name)}
                </div>

                <div className="flex-1">
                    <div className="text-cal-text-default whitespace-pre-line mb-4 text-sm">
                        {`hey — its peer from cal.com thanks for using cal.com, really appreciate it

is everything working as expected? if anything feels off or confusing i can help just reply

also curious how its been so far whats working / whats not

-peer`}
                    </div>

                    <Textarea placeholder="Write a reply..." value={reply} onChange={(e) => setReply(e.target.value)} />
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => close(true)}>
                    Close
                </Button>
                <Button onClick={sendReply} disabled={!reply.trim()}>
                    Send reply
                </Button>
            </div>
        </Dialog>
    );
}
