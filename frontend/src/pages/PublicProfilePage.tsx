import { useNavigate, useParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { defaultUser } from '../data/seed';
import { getInitials } from '../lib/utils';
import { Card } from '../components/ui/Card';
import * as api from '../lib/api';

type PublicProfile = {
    user: {
        id: string;
        username: string;
        name: string | null;
        timezone: string | null;
    };
    event_types: Array<{
        id: string;
        title: string;
        slug: string;
        duration_minutes: number;
        is_active: boolean;
    }>;
};

export function PublicProfilePage() {
    const navigate = useNavigate();
    const { username } = useParams<{ username: string }>();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function run() {
            const requestedUsername = username || defaultUser.username;

            setLoading(true);
            setLoadError(null);

            try {
                const result = await api.fetchPublicProfile(requestedUsername, { cache: 'no-store' });
                if (active) {
                    setProfile(result);
                }
            } catch (firstErr) {
                // If route username is stale/wrong, retry against canonical seeded username.
                if (requestedUsername !== defaultUser.username) {
                    try {
                        const fallback = await api.fetchPublicProfile(defaultUser.username, { cache: 'no-store' });
                        if (active) {
                            setProfile(fallback);
                            if (fallback?.user?.username && fallback.user.username !== requestedUsername) {
                                navigate(`/${fallback.user.username}`, { replace: true });
                            }
                        }
                        return;
                    } catch {
                        // fall through to error state
                    }
                }

                if (active) {
                    setProfile(null);
                    setLoadError(firstErr instanceof Error ? firstErr.message : 'Failed to load public profile');
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }
        void run();
        return () => {
            active = false;
        };
    }, [username, navigate]);

    const displayName = profile?.user.name || defaultUser.name;
    const publicUsername = profile?.user.username || username || defaultUser.username;

    const activeEvents = useMemo(() => {
        if (!profile) return [];
        return profile.event_types
            .filter((eventType) => eventType.is_active)
            .map((eventType) => ({
                id: eventType.id,
                title: eventType.title,
                slug: eventType.slug,
                duration: Number(eventType.duration_minutes || 0),
            }));
    }, [profile]);

    return (
        <div className="min-h-screen bg-cal-bg-base px-4 py-12 sm:px-6">
            <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8">
                <Card className="px-6 py-7 sm:px-8">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-sky-900/20">
                            {getInitials(displayName)}
                        </div>
                        <div>
                            <h1 className="text-4xl font-semibold tracking-tight text-cal-text-primary">{displayName}</h1>
                        </div>
                    </div>
                </Card>

                {loading && (
                    <Card className="py-16 text-center">
                        <p className="text-cal-text-muted">Loading event types...</p>
                    </Card>
                )}

                {!loading && activeEvents.length === 0 ? (
                    <Card className="py-16 text-center">
                        <p className="text-cal-text-muted">
                            {loadError ? 'Could not load this public profile from backend.' : 'No event types available at the moment.'}
                        </p>
                    </Card>
                ) : !loading ? (
                    <Card noPadding className="overflow-hidden">
                        {activeEvents.map((eventType, index) => (
                            <button
                                key={eventType.id}
                                onClick={() => navigate(`/${publicUsername}/${eventType.slug}`)}
                                className={`w-full px-6 py-6 text-left transition-colors hover:bg-white/[0.025] ${index !== 0 ? 'border-t border-cal-border' : ''}`}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-[1.75rem] font-semibold tracking-tight text-cal-text-primary">{eventType.title}</div>
                                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white/7 px-2 py-1 text-xs font-semibold text-cal-text-default">
                                            <Clock size={12} />
                                            {eventType.duration}m
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </Card>
                ) : null}
            </div>
        </div>
    );
}
