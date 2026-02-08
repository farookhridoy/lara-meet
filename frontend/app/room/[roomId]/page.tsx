
'use client';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MeetingOverlay from '@/components/MeetingOverlay';
import CustomControlBar from '@/components/CustomControlBar';
import SidePanel from '@/components/SidePanel';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, DataPacket_Kind } from 'livekit-client';

export default function RoomPage() {
    const { roomId } = useParams();
    const [token, setToken] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [isPreJoin, setIsPreJoin] = useState(true);
    const [sidePanelTab, setSidePanelTab] = useState<'chat' | 'participants' | 'notes' | null>(null);

    const joinRoom = async () => {
        if (!username) return;
        try {
            const resp = await fetch(`/api/token?room=${roomId}&username=${username}`);
            const data = await resp.json();
            setToken(data.token);
            setIsPreJoin(false);
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
            video={true}
            audio={true}
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
            <RoomEventsHandler />
        </LiveKitRoom>
    );
}

function RoomEventsHandler() {
    const room = useRoomContext();

    useEffect(() => {
        const handleData = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
            if (topic === 'ask_unmute') {
                // Simple alert for now, or use a toast library if added
                // Decoded: JSON.parse(new TextDecoder().decode(payload))
                const confirmUnmute = window.confirm("The host has asked you to unmute your microphone. Unmute now?");
                if (confirmUnmute) {
                    room.localParticipant.setMicrophoneEnabled(true);
                }
            }
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => {
            room.off(RoomEvent.DataReceived, handleData);
        };
    }, [room]);

    return null;
}
