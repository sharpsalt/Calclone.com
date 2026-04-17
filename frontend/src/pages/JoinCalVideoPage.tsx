import { format, parse } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Camera,
    ChevronLeft,
    ChevronRight,
    Headphones,
    Mic,
    MoreHorizontal,
    Sparkles,
    Users,
    MessageSquare,
    Share2,
    Grid,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
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
    const [inCall, setInCall] = useState(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const cameras = useMemo(() => devices.filter((d) => d.kind === 'videoinput'), [devices]);
    const microphones = useMemo(() => devices.filter((d) => d.kind === 'audioinput'), [devices]);
    const speakers = useMemo(() => devices.filter((d) => d.kind === 'audiooutput'), [devices]);

    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
    const [selectedMicId, setSelectedMicId] = useState<string | null>(null);
    const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(null);

    const audioTestRef = useRef<HTMLAudioElement | null>(null);
    const [isTestingMic, setIsTestingMic] = useState(false);
    const [isTestingSpeaker, setIsTestingSpeaker] = useState(false);
    const [mediaError, setMediaError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!booking && id) {
            void fetchBookingById(id);
        }
    }, [booking, fetchBookingById, id]);

    // enumerate devices and handle device changes
    useEffect(() => {
        let mounted = true;

        async function updateDevices() {
            if (!navigator.mediaDevices?.enumerateDevices) return;
            try {
                const list = await navigator.mediaDevices.enumerateDevices();
                if (!mounted) return;
                setDevices(list);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('enumerateDevices failed', err);
            }
        }

        void updateDevices();
        const onDeviceChange = () => void updateDevices();
        navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange);

        return () => {
            mounted = false;
            navigator.mediaDevices?.removeEventListener?.('devicechange', onDeviceChange);
        };
    }, []);

    // pick sensible defaults when devices list updates
    useEffect(() => {
        if (!selectedCameraId) {
            const cam = devices.find((d) => d.kind === 'videoinput');
            if (cam) setSelectedCameraId(cam.deviceId);
        }
        if (!selectedMicId) {
            const mic = devices.find((d) => d.kind === 'audioinput');
            if (mic) setSelectedMicId(mic.deviceId);
        }
        if (!selectedSpeakerId) {
            const sp = devices.find((d) => d.kind === 'audiooutput');
            if (sp) setSelectedSpeakerId(sp.deviceId);
        }
    }, [devices]);

    // helper to (re)create the media stream based on selected devices and toggles
    const getMedia = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setMediaError('Media devices API not available in this browser.');
            setHasMedia(false);
            return;
        }

        // stop existing
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }

        const videoConstraint: any = cameraOn ? {} : false;
        if (cameraOn && selectedCameraId) videoConstraint.deviceId = { exact: selectedCameraId };

        let audioConstraint: any = micOn ? {} : false;
        if (micOn && selectedMicId) audioConstraint = { deviceId: { exact: selectedMicId } };

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: audioConstraint });
            streamRef.current = stream;
            setHasMedia(true);
            setMediaError(null);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                const p = videoRef.current.play?.();
                if (p && typeof p.then === 'function') p.catch(() => {});
            }
        } catch (err: any) {
            // capture a helpful error message
            // eslint-disable-next-line no-console
            console.error('getUserMedia error', err);
            setMediaError(err?.message ? String(err.message) : 'Unable to access camera/microphone');
            setHasMedia(false);
        }
    };

    // Join / leave handlers
    const handleJoin = async () => {
        setShowDock(false);
        await getMedia();
        setInCall(true);
    };

    const handleLeave = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setHasMedia(false);
        setInCall(false);
        navigate('/bookings');
    };

    // recreate stream when selected devices or toggles change
    useEffect(() => {
        void getMedia();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
        };
    }, [selectedCameraId, selectedMicId, cameraOn, micOn]);

    // mic test: record short snippet and play it back
    const testMic = async () => {
        if (!navigator.mediaDevices?.getUserMedia) return;
        setIsTestingMic(true);
        setMediaError(null);
        let s: MediaStream | null = null;
        try {
            s = await navigator.mediaDevices.getUserMedia({ audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true });
            const recorder = new MediaRecorder(s as MediaStream);
            const chunks: Blob[] = [];
            recorder.ondataavailable = (ev) => {
                if (ev.data && ev.data.size) chunks.push(ev.data);
            };
            recorder.start();
            await new Promise((res) => setTimeout(res, 1400));
            recorder.stop();
            await new Promise((res) => (recorder.onstop = res));
            const blob = new Blob(chunks, { type: 'audio/webm' });
            if (audioTestRef.current) {
                audioTestRef.current.src = URL.createObjectURL(blob);
                // play the recorded snippet
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                audioTestRef.current.play();
            }
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.error('Mic test error', err);
            setMediaError(err?.message ? String(err.message) : 'Mic test failed');
        } finally {
            setIsTestingMic(false);
            if (s) s.getTracks().forEach((t) => t.stop());
        }
    };

    // speaker test: generate a beep and play through selected sink if supported
    const testSpeaker = async () => {
        setIsTestingSpeaker(true);
        setMediaError(null);
        const audioEl = audioTestRef.current;
        if (!audioEl) {
            setIsTestingSpeaker(false);
            return;
        }

        let ctx: AudioContext | null = null;
        try {
            ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 880;
            const dest = ctx.createMediaStreamDestination();
            osc.connect(dest);
            osc.start();

            audioEl.srcObject = dest.stream;
                if (selectedSpeakerId && typeof (audioEl as any).setSinkId === 'function') {
                try {
                    await (audioEl as any).setSinkId(selectedSpeakerId);
                } catch (err) {
                    // eslint-disable-next-line no-console
                    console.warn('setSinkId failed', err);
                }
            }

            // play for a short beep
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            audioEl.play();
            await new Promise((res) => setTimeout(res, 700));
            osc.stop();
            // stop generated stream tracks
            dest.stream.getTracks().forEach((t) => t.stop());
            audioEl.pause();
            audioEl.srcObject = null;
            await ctx.close();
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.error('Speaker test error', err);
            setMediaError(err?.message ? String(err.message) : 'Speaker test failed');
            if (ctx) await ctx.close().catch(() => {});
        } finally {
            setIsTestingSpeaker(false);
        }
    };

    // Ensure the video element gets the stream when it mounts or when media becomes available
    useEffect(() => {
        if (!hasMedia) return;
        if (videoRef.current && streamRef.current) {
            if (videoRef.current.srcObject !== streamRef.current) {
                videoRef.current.srcObject = streamRef.current;
            }
            const p = videoRef.current.play?.();
            if (p && typeof p.then === 'function') p.catch(() => {});
        }
    }, [hasMedia, cameraOn]);

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
            <div className="min-h-screen bg-black text-zinc-100 px-4 py-8">
                <div className="mx-auto w-full max-w-[680px]">
                    <div className="cal-card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                            <Skeleton className="h-6 w-48 rounded-md" />
                            <Skeleton className="h-8 w-24 rounded-md" />
                        </div>

                        <div className="relative bg-zinc-900">
                            <div className="aspect-video">
                                <Skeleton className="h-full w-full" />
                            </div>
                            <div className="p-6">
                                <Skeleton className="h-5 w-56 rounded-md mb-2" />
                                <Skeleton className="h-4 w-40 rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const whenDate = format(new Date(`${booking.date}T00:00:00`), 'd MMMM yyyy');
    const whenTime = format(parse(booking.startTime, 'HH:mm', new Date()), 'h:mm a').toLowerCase();

    // If user has joined the call, show the in-call full-screen UI
    if (inCall) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-black text-zinc-100">
                <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between bg-black/80 border-b border-zinc-800 px-4 py-2">
                    <div className="flex items-center gap-4">
                        <div className="text-[1rem] font-semibold">Cal.com</div>
                        <div className="text-sm text-zinc-300">Waiting for others to join</div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                        <span>Speaker view</span>
                        <Grid size={16} />
                    </div>
                </div>

                <div className="pt-14">
                    <div className="mx-auto max-w-[1200px] px-4">
                        <div className="relative aspect-video bg-black">
                            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                            <div className="absolute bottom-4 left-6 rounded-md bg-black/60 px-2 py-1 text-sm">{defaultUser.name} (You)</div>
                        </div>
                    </div>
                </div>

                <div className="fixed left-0 right-0 bottom-0 z-50 bg-black/90 border-t border-zinc-800">
                    <div className="mx-auto max-w-[1200px] px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => setCameraOn((v) => !v)} className={cn('flex items-center gap-2 rounded-md px-3 py-2', cameraOn ? 'bg-zinc-800 text-white' : 'text-zinc-400')}>
                                <Camera size={18} />
                                <span className="text-sm">{cameraOn ? 'Turn off' : 'Turn on'}</span>
                            </button>
                            <button type="button" onClick={() => setMicOn((v) => !v)} className={cn('flex items-center gap-2 rounded-md px-3 py-2', micOn ? 'bg-zinc-800 text-white' : 'text-zinc-400')}>
                                <Mic size={18} />
                                <span className="text-sm">{micOn ? 'Mute' : 'Unmute'}</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <button type="button" className="w-12 h-12 rounded-full bg-white text-zinc-900 flex items-center justify-center"><Users size={18} /></button>
                            <button type="button" className="w-12 h-12 rounded-full bg-white text-zinc-900 flex items-center justify-center"><MessageSquare size={18} /></button>
                            <button type="button" className="w-12 h-12 rounded-full bg-white text-zinc-900 flex items-center justify-center"><Share2 size={18} /></button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-sm text-zinc-200">People Chat Share</div>
                            <button type="button" onClick={handleLeave} className="rounded-md bg-red-600 px-3 py-2 text-sm text-white">Leave</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                            <h2 className="text-[1.6rem] font-semibold tracking-tight">Are you ready to join?</h2>
                            <Button variant="secondary" size="sm" onClick={handleJoin}>Join</Button>
                        </div>

                    <div className="relative bg-zinc-900">
                        <div className="aspect-video">
                            {hasMedia ? (
                                cameraOn ? (
                                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-zinc-400">Camera is turned off</div>
                                )
                            ) : (
                                <div className="flex h-full items-center justify-center text-zinc-400">Camera preview unavailable</div>
                            )}
                        </div>

                        {mediaError && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 p-4 text-center text-red-300">
                                <div className="mb-2 font-semibold">{mediaError}</div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => void getMedia()} className="underline">Retry</button>
                                    <button type="button" onClick={() => { setMediaError(null); void getMedia(); }} className="underline">Request permission</button>
                                </div>
                            </div>
                        )}

                        <div className="absolute left-0 right-0 bottom-0 z-10 border-t border-zinc-800 bg-black/60">
                            <div className="mx-auto max-w-[640px] px-5 py-3 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-6">
                                    <button type="button" onClick={() => setCameraOn((v) => !v)} className={cn('flex items-center gap-2', cameraOn ? 'text-white' : 'text-zinc-400')}>
                                        <Camera size={18} />
                                        <span className="text-xs">{cameraOn ? 'Turn off' : 'Turn on'}</span>
                                    </button>
                                    <button type="button" onClick={() => setMicOn((v) => !v)} className={cn('flex items-center gap-2', micOn ? 'text-white' : 'text-zinc-400')}>
                                        <Mic size={18} />
                                        <span className="text-xs">{micOn ? 'Mute' : 'Unmute'}</span>
                                    </button>
                                    <div className="flex items-center gap-2 text-zinc-200">
                                        <Sparkles size={18} />
                                        <span className="text-xs">Effects</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-200">
                                        <Headphones size={18} />
                                        <span className="text-xs">Reduce</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-zinc-200">
                                    <div className="flex items-center gap-2 text-sm text-zinc-100 bg-black/20 rounded-md px-3 py-1">{defaultUser.name}</div>
                                    <MoreHorizontal size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 px-5 py-5">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-200">
                                <Camera size={15} />
                                Camera
                            </div>
                            <div>
                                <Select
                                    options={cameras.length > 0 ? cameras.map((c, idx) => ({ value: c.deviceId, label: c.label || `Camera ${idx + 1}` })) : [{ value: '', label: 'No cameras' }]}
                                    value={selectedCameraId ?? ''}
                                    onChange={(e) => setSelectedCameraId(e.target.value || null)}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-zinc-200">
                                <span className="inline-flex items-center gap-2">
                                    <Mic size={15} />
                                    Microphone
                                </span>
                                <button type="button" onClick={() => void testMic()} className="text-[1.02rem] underline">
                                    {isTestingMic ? 'Testing...' : 'Test your mic'}
                                </button>
                            </div>
                            <div>
                                <Select
                                    options={microphones.length > 0 ? microphones.map((m, idx) => ({ value: m.deviceId, label: m.label || `Microphone ${idx + 1}` })) : [{ value: '', label: 'No microphones' }]}
                                    value={selectedMicId ?? ''}
                                    onChange={(e) => setSelectedMicId(e.target.value || null)}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-zinc-200">
                                <span className="inline-flex items-center gap-2">
                                    <Headphones size={15} />
                                    Speakers
                                </span>
                                <button type="button" onClick={() => void testSpeaker()} className="text-[1.02rem] underline">
                                    {isTestingSpeaker ? 'Testing...' : 'Play test sound'}
                                </button>
                            </div>
                            <div>
                                <Select
                                    options={speakers.length > 0 ? speakers.map((s, idx) => ({ value: s.deviceId, label: s.label || `Speaker ${idx + 1}` })) : [{ value: '', label: 'System default' }]}
                                    value={selectedSpeakerId ?? ''}
                                    onChange={(e) => setSelectedSpeakerId(e.target.value || null)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <audio ref={audioTestRef} className="hidden" />

                <div className="mt-5 text-center">
                    <button type="button" onClick={() => navigate('/bookings')} className="text-sm text-zinc-400 hover:text-zinc-200">
                        Back to bookings
                    </button>
                </div>
            </main>
        </div>
    );
}
