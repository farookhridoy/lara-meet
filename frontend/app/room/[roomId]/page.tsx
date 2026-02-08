
'use client';
import { LiveKitRoom, VideoConference, useRoomContext, useLocalParticipant } from '@livekit/components-react';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MeetingOverlay from '@/components/MeetingOverlay';
import CustomControlBar from '@/components/CustomControlBar';
import SidePanel from '@/components/SidePanel';
import { RoomEvent } from 'livekit-client';

export default function RoomPage() {
    const { roomId } = useParams();
    const [token, setToken] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [isPreJoin, setIsPreJoin] = useState(true);
    const [sidePanelTab, setSidePanelTab] = useState<'chat' | 'participants' | 'notes' | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [waitingMessage, setWaitingMessage] = useState('Waiting for host to let you in...');

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const joinRoom = async () => {
        if (!username) return;
        try {
            const isHost = new URLSearchParams(window.location.search).get('host') === 'true';
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const resp = await fetch(`${apiUrl}/get-token?room=${roomId}&username=${username}&is_host=${isHost}`);
            const data = await resp.json();

            if (!isHost) {
                // Guests enter waiting state
                setIsWaiting(true);
                // We don't setToken yet to prevent LiveKit connection
                // Instead we set up a temporary listener or use a separate mechanism
                // For simplicity in this demo, we'll connect but stay in a 'Lobby' UI
                setToken(data.token);
                setIsPreJoin(false);
            } else {
                setToken(data.token);
                setIsPreJoin(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (isPreJoin) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-white font-sans">
                <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl space-y-8 w-full max-w-md border border-zinc-800">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-normal text-white">Ready to join?</h2>
                        <p className="text-zinc-500">No one else is here</p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Your name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-4 bg-zinc-800/80 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-zinc-500 text-lg group-hover:bg-zinc-800"
                                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={joinRoom}
                                disabled={!username}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-medium transition-all shadow-lg hover:shadow-blue-500/20"
                            >
                                Join now
                            </button>
                            <button className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-full font-medium transition-colors text-blue-400">
                                Present
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            video={!isWaiting}
            audio={!isWaiting}
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            data-lk-theme="default"
            style={{ height: '100dvh', position: 'relative' }}
        >
            <MeetingOverlay />
            <VideoConference />
            <SidePanel
                activeTab={sidePanelTab}
                onClose={() => setSidePanelTab(null)}
                onTabChange={(tab) => setSidePanelTab(tab)}
            />
            <CustomControlBar
                onToggleChat={() => setSidePanelTab(prev => prev === 'chat' ? null : 'chat')}
                onToggleUsers={() => setSidePanelTab(prev => prev === 'participants' ? null : 'participants')}
                onToggleNotes={() => setSidePanelTab(prev => prev === 'notes' ? null : 'notes')}
                activeTab={sidePanelTab}
            />
            {isWaiting && (
                <WaitingLobby
                    message={waitingMessage}
                    onCancel={() => window.location.href = '/'}
                />
            )}
            <RoomEventsHandler isWaiting={isWaiting} setIsWaiting={setIsWaiting} setWaitingMessage={setWaitingMessage} />
        </LiveKitRoom>
    );
}

function WaitingLobby({ message, onCancel }: { message: string, onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-[1000] bg-zinc-950 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-8 h-8 bg-blue-600 rounded-full" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-medium text-white">Hold on...</h3>
                    <p className="text-zinc-400 leading-relaxed">
                        {message}
                    </p>
                </div>
                <div className="pt-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium"
                    >
                        Cancel request
                    </button>
                </div>
            </div>
        </div>
    );
}

function RoomEventsHandler({ isWaiting, setIsWaiting, setWaitingMessage }: { isWaiting: boolean, setIsWaiting: (v: boolean) => void, setWaitingMessage: (v: string) => void }) {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    useEffect(() => {
        // Automatically set host metadata if the URL indicates we are the host
        const isHost = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('host') === 'true';
        if (isHost && room.state === 'connected') {
            const currentMeta = localParticipant.metadata ? JSON.parse(localParticipant.metadata) : {};
            if (!currentMeta.is_host) {
                localParticipant.setMetadata(JSON.stringify({ ...currentMeta, is_host: true }));
            }
        }
    }, [room.state, localParticipant]);

    useEffect(() => {
        const sendJoinRequest = async () => {
            if (room.state !== 'connected' || !isWaiting) return;

            try {
                const encoder = new TextEncoder();
                await localParticipant.publishData(
                    encoder.encode(JSON.stringify({ action: 'request_join', name: localParticipant.name })),
                    { reliable: true, topic: 'join_request' }
                );
            } catch (err) {
                console.error("Failed to send join request:", err);
            }
        };

        // If we are waiting, we need to send the request
        // But we must wait for the room to be connected
        if (room.state === 'connected' && isWaiting) {
            sendJoinRequest();
            // Also set local metadata to indicate waiting state to others
            const currentMeta = localParticipant.metadata ? JSON.parse(localParticipant.metadata) : {};
            localParticipant.setMetadata(JSON.stringify({ ...currentMeta, is_waiting: true }));
        } else if (isWaiting) {
            const onStateChange = (state: any) => {
                if (state === 'connected') {
                    sendJoinRequest();
                    // Also set local metadata to indicate waiting state to others
                    const currentMeta = localParticipant.metadata ? JSON.parse(localParticipant.metadata) : {};
                    localParticipant.setMetadata(JSON.stringify({ ...currentMeta, is_waiting: true }));
                    room.off('connectionStateChanged', onStateChange);
                }
            };
            room.on('connectionStateChanged', onStateChange);
            return () => {
                room.off('connectionStateChanged', onStateChange);
            };
        }
    }, [room, localParticipant, isWaiting]);

    useEffect(() => {
        const handleData = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
            if (topic === 'end_session') {
                room.disconnect();
                window.location.href = '/';
            }

            if (topic === 'cohost_action') {
                const data = JSON.parse(new TextDecoder().decode(payload));
                const currentMeta = room.localParticipant.metadata ? JSON.parse(room.localParticipant.metadata) : {};
                const newMeta = { ...currentMeta, is_cohost: data.action === 'promote' };
                room.localParticipant.setMetadata(JSON.stringify(newMeta));
            }

            if (topic === 'join_response') {
                const data = JSON.parse(new TextDecoder().decode(payload));
                if (data.status === 'accepted') {
                    setIsWaiting(false);
                    // Clear waiting metadata
                    const currentMeta = room.localParticipant.metadata ? JSON.parse(room.localParticipant.metadata) : {};
                    const { is_waiting, ...rest } = currentMeta;
                    room.localParticipant.setMetadata(JSON.stringify(rest));
                } else if (data.status === 'hold') {
                    setWaitingMessage(data.message || "The host has put you on hold. Please be patient...");
                }
            }

            if (topic === 'ask_unmute') {
                // Play notification sound
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                audio.play().catch(e => console.log("Audio play blocked by browser:", e));

                // Show visual alert
                alert("The host would like you to unmute your microphone.");
            }
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => {
            room.off(RoomEvent.DataReceived, handleData);
        };
    }, [room]);

    return null;
}
