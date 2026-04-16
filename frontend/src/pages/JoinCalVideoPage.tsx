import { format, parse } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Camera,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Headphones,
    Mic,
    MoreHorizontal,
    Sparkles,
} from 'lucide-react';
import { defaultUser } from '../data/seed';
import { cn } from '../lib/utils';
import { useBookingStore } from '../stores/bookingStore';

export function JoinCalVideoPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { bookings, fetchBookingById } = useBookingStore();

    const booking = useMemo(() => bookings.find((item) => item.id === id), [bookings, id]);

    const [showDock, setShowDock] = useState(false);
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [hasMedia, setHasMedia] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!booking && id) {
            void fetchBookingById(id);
        }
    }, [booking, fetchBookingById, id]);

    useEffect(() => {
        let mounted = true;

        async function setupMedia() {
            if (!navigator.mediaDevices?.getUserMedia) return;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (!mounted) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;
                setHasMedia(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch {
                setHasMedia(false);
            }
        }

        void setupMedia();

        return () => {
            mounted = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const stream = streamRef.current;
        if (!stream) return;
        stream.getVideoTracks().forEach((track) => {
            track.enabled = cameraOn;
        });
    }, [cameraOn]);

    useEffect(() => {
        const stream = streamRef.current;
        if (!stream) return;
        stream.getAudioTracks().forEach((track) => {
            track.enabled = micOn;
        });
    }, [micOn]);

    if (!booking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-zinc-300">
                Loading booking...
            </div>
        );
    }

    const whenDate = format(new Date(`${booking.date}T00:00:00`), 'd MMMM yyyy');
    const whenTime = format(parse(booking.startTime, 'HH:mm', new Date()), 'h:mm a').toLowerCase();

    return (
        <div className="relative min-h-screen overflow-hidden bg-black text-zinc-100">
            <div className="pointer-events-none absolute left-6 top-6 text-[2.2rem] font-semibold tracking-tight text-zinc-100">
                Cal.com
            </div>

            <button
                type="button"
                onClick={() => setShowDock((value) => !value)}
                className={cn(
                    'fixed left-0 top-1/2 z-30 flex h-[84px] w-10 -translate-y-1/2 items-center justify-center rounded-r-xl border border-zinc-700 bg-zinc-900/90 text-zinc-300 hover:text-white',
                    showDock && 'left-[240px]'
                )}
            >
                {showDock ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>

            {showDock && (
                <aside className="fixed left-0 top-0 z-20 h-full w-[244px] overflow-auto bg-zinc-100 px-4 py-6 text-zinc-900">
                    <div className="space-y-8 text-[1.05rem]">
                        <section>
                            <h3 className="text-[2rem] font-semibold tracking-tight">What:</h3>
                            <p className="mt-2">{booking.eventTitle} between</p>
                            <p>{defaultUser.name} and {booking.bookerName}</p>
                        </section>

                        <section>
                            <h3 className="text-[2rem] font-semibold tracking-tight">Invitee timezone:</h3>
                            <p className="mt-2">{defaultUser.timezone}</p>
                        </section>

                        <section>
                            <h3 className="text-[2rem] font-semibold tracking-tight">When:</h3>
                            <p className="mt-2">{whenDate}</p>
                            <p>{whenTime}</p>
                        </section>

                        <section>
                            <h3 className="text-[2rem] font-semibold tracking-tight">Time left</h3>
                            <p className="mt-2">{booking.duration} Minutes</p>
                            <div className="mt-4 h-2 rounded-full bg-zinc-200">
                                <div className="h-2 w-1/3 rounded-full bg-zinc-400" />
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[2rem] font-semibold tracking-tight">Who:</h3>
                            <p className="mt-2">{defaultUser.name} - Organizer:</p>
                            <p className="underline">bt23cse219@iiitn.ac.in</p>
                            <p className="mt-4">{booking.bookerName} -</p>
                            <p className="underline">{booking.bookerEmail}</p>
                        </section>
                    </div>
                </aside>
            )}

            <main className={cn('px-4 pb-8 pt-12', showDock ? 'pl-[260px]' : '')}>
                <div className="mx-auto w-full max-w-[560px] rounded-md border border-zinc-800 bg-zinc-950/95">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                        <h2 className="text-[2rem] font-semibold tracking-tight">Are you ready to join?</h2>
                        <button
                            type="button"
                            onClick={() => window.alert('Joining call...')}
                            className="rounded-lg bg-zinc-800 px-5 py-2 text-[1.05rem] font-semibold hover:bg-zinc-700"
                        >
                            Join
                        </button>
                    </div>

                    <div className="relative aspect-video bg-zinc-900">
                        {hasMedia ? (
                            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full items-center justify-center text-zinc-400">Camera preview unavailable</div>
                        )}
                        <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-sm font-medium">
                            {defaultUser.name}
                        </div>
                    </div>

                    <div className="grid grid-cols-5 border-b border-zinc-800 px-5 py-3 text-center text-sm">
                        <button type="button" onClick={() => setCameraOn((value) => !value)} className="flex flex-col items-center gap-1 hover:text-white">
                            <Camera size={20} />
                            {cameraOn ? 'Turn off' : 'Turn on'}
                        </button>
                        <button type="button" onClick={() => setMicOn((value) => !value)} className="flex flex-col items-center gap-1 hover:text-white">
                            <Mic size={20} />
                            {micOn ? 'Mute' : 'Unmute'}
                        </button>
                        <button type="button" className="flex flex-col items-center gap-1 text-zinc-200 hover:text-white">
                            <Sparkles size={20} />
                            Effects
                        </button>
                        <button type="button" className="flex flex-col items-center gap-1 text-zinc-200 hover:text-white">
                            <Headphones size={20} />
                            Reduce
                        </button>
                        <button type="button" className="flex flex-col items-center gap-1 text-zinc-200 hover:text-white">
                            <MoreHorizontal size={20} />
                            More
                        </button>
                    </div>

                    <div className="space-y-4 px-5 py-5">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-200">
                                <Camera size={15} />
                                Camera
                            </div>
                            <button type="button" className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-700 px-3 text-left text-[1.02rem]">
                                Integrated Webcam
                                <ChevronDown size={16} />
                            </button>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-zinc-200">
                                <span className="inline-flex items-center gap-2">
                                    <Mic size={15} />
                                    Microphone
                                </span>
                                <button type="button" className="text-[1.02rem] underline">Test your mic</button>
                            </div>
                            <button type="button" className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-700 px-3 text-left text-[1.02rem]">
                                Microphone Array (2- Intel Smart Sound Technology for Digital Microphones)
                                <ChevronDown size={16} />
                            </button>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-zinc-200">
                                <span className="inline-flex items-center gap-2">
                                    <Headphones size={15} />
                                    Speakers
                                </span>
                                <button type="button" className="text-[1.02rem] underline">Play test sound</button>
                            </div>
                            <button type="button" className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-700 px-3 text-left text-[1.02rem]">
                                System default
                                <ChevronDown size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-5 text-center">
                    <button type="button" onClick={() => navigate('/bookings')} className="text-sm text-zinc-400 hover:text-zinc-200">
                        Back to bookings
                    </button>
                </div>
            </main>
        </div>
    );
}
