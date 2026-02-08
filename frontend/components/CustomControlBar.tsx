
'use client';

import {
    useLocalParticipant,
    useRoomContext,
    TrackToggle,
    DisconnectButton,
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import {
    Mic, MicOff,
    Video, VideoOff,
    Monitor, MonitorOff,
    PhoneOff,
    MoreVertical,
    MessageSquare,
    Users,
    Hand,
    LayoutGrid,
    Maximize,
    StickyNote,
    Settings,
    ChevronDown,
    X,
    Info,
    Copy,
    CheckCircle,
    Shield
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import SettingsModal from './SettingsModal';
import { useLocalRecording } from '@/hooks/useLocalRecording';
import { useChat } from '@livekit/components-react';

interface CustomControlBarProps {
    onToggleChat: () => void;
    onToggleUsers: () => void;
    onToggleNotes: () => void;
    activeTab: 'chat' | 'participants' | 'notes' | null;
}

export default function CustomControlBar({ onToggleChat, onToggleUsers, onToggleNotes, activeTab }: CustomControlBarProps) {
    const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
    const [showMore, setShowMore] = useState(false);
    const startedAt = useRef(new Date().toISOString());

    const [time, setTime] = useState('');
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isRinging, setIsRinging] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [isCoHost, setIsCoHost] = useState(false);
    const [screenShareLocked, setScreenShareLocked] = useState(false);
    const { isRecording, recordingTime, startRecording, stopRecording } = useLocalRecording();
    const { chatMessages } = useChat();
    const [mounted, setMounted] = useState(false);
    const room = useRoomContext();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (localParticipant.metadata) {
            try {
                const meta = JSON.parse(localParticipant.metadata);
                setIsHandRaised(!!meta.handRaised);
                setIsHost(!!meta.is_host);
                setIsCoHost(!!meta.is_cohost);
            } catch {
                setIsHandRaised(false);
                setIsHost(false);
                setIsCoHost(false);
            }
        }
    }, [localParticipant.metadata]);

    useEffect(() => {
        const handleRoomMetadata = (meta?: string) => {
            if (meta) {
                try {
                    const data = JSON.parse(meta);
                    setScreenShareLocked(!!data.screenShareLocked);
                } catch { }
            }
        };
        handleRoomMetadata(room.metadata);
        room.on(RoomEvent.RoomMetadataChanged, handleRoomMetadata);
        return () => { room.off(RoomEvent.RoomMetadataChanged, handleRoomMetadata); };
    }, [room]);

    const isLocalAdmin = isHost || isCoHost;

    const toggleScreenShareLock = async () => {
        if (!isLocalAdmin) return;
        const newState = !screenShareLocked;
        const encoder = new TextEncoder();
        await localParticipant.publishData(encoder.encode(JSON.stringify({ locked: newState })), {
            reliable: true,
            topic: 'screen_share_lock'
        });
        setScreenShareLocked(newState);
    };

    const toggleHandRaise = async () => {
        const currentMeta = localParticipant.metadata ? JSON.parse(localParticipant.metadata) : {};
        const newHandState = !currentMeta.handRaised;
        await localParticipant.setMetadata(JSON.stringify({ ...currentMeta, handRaised: newHandState }));
        setIsHandRaised(newHandState);
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleData = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
            if (topic === 'chat' || topic === 'lk-chat-topic' || topic === 'private_chat') {
                if (activeTab !== 'chat') {
                    setUnreadCount(prev => prev + 1);
                    setIsRinging(true);
                    setTimeout(() => setIsRinging(false), 1000);
                }
            }
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => { room.off(RoomEvent.DataReceived, handleData); };
    }, [room, activeTab]);

    useEffect(() => {
        if (activeTab === 'chat') {
            setUnreadCount(0);
        }
    }, [activeTab]);

    useEffect(() => {
        const updateTime = () => {
            setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const exportMeetingSummary = async () => {
        const notes = localStorage.getItem('meeting_notes') || 'No notes taken.';
        const chat = chatMessages.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.from?.name || 'User'}: ${m.message}`).join('\n');

        const summaryText = `
MEETING SUMMARY
Room: ${room.name}
Date: ${new Date().toLocaleDateString()}
-----------------------------------

NOTES:
${notes}

-----------------------------------
CHAT HISTORY:
${chat}
        `;

        // 1. Download local copy
        const blob = new Blob([summaryText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-summary-${room.name}.txt`;
        a.click();

        // 2. Send to Backend
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            await fetch(`${apiUrl}/summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: room.name,
                    summary: summaryText,
                    started_at: startedAt.current,
                    finished_at: new Date().toISOString(),
                })
            });
        } catch (error) {
            console.error('Failed to save summary to backend:', error);
        }

        // 3. Cleanup Attachments from Server (Self-destruct)
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            await fetch(`${apiUrl}/cleanup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_id: room.name })
            });
        } catch (error) {
            console.error('Failed to cleanup room files:', error);
        }

        // Cleanup
        localStorage.removeItem('meeting_notes');
    };

    // Common button styles
    const buttonBase = "p-3 rounded-full text-white transition-all duration-200 flex items-center justify-center h-12 w-12";
    const buttonActive = "bg-zinc-700/80 hover:bg-zinc-600 border border-zinc-600";
    const buttonInactive = "bg-red-500/90 hover:bg-red-600 text-white border-none shadow-red-500/20 shadow-lg";
    const buttonSpecial = "bg-blue-300 text-blue-900 hover:bg-blue-200";

    if (!mounted) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-6 z-[100]">

            {/* Left: Time / Info */}
            <div className="hidden md:flex items-center gap-4 text-white min-w-[200px]">
                <span className="font-medium text-sm text-zinc-300">
                    {time}
                </span>
                <span className="border-l border-zinc-700 h-4"></span>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors outline-none group">
                            <Info size={18} className="text-zinc-500 group-hover:text-blue-400 transition-colors" />
                            <span>Meeting details</span>
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 min-w-[320px] animate-in slide-in-from-bottom-2 duration-200 z-[200] mb-4" sideOffset={12} align="start">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-white font-medium mb-1">Joining info</h4>
                                    <p className="text-zinc-400 text-xs">Share this link with people you want in the meeting</p>
                                </div>

                                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 flex items-center justify-between gap-3 group/link hover:border-blue-500/30 transition-colors">
                                    <span className="text-sm text-zinc-300 truncate">
                                        {typeof window !== 'undefined' ? window.location.origin + '/room/' + room.name : room.name}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const url = window.location.origin + '/room/' + room.name;
                                            navigator.clipboard.writeText(url);
                                            alert("Link copied to clipboard!");
                                        }}
                                        className="p-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                        title="Copy link"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>

                                <div className="text-[10px] text-zinc-500 flex items-center gap-2 bg-zinc-800/30 p-2 rounded-lg">
                                    <Shield size={10} className="text-zinc-600" />
                                    <span>Only people invited by the host can join directly. Still waiting room is active.</span>
                                </div>
                            </div>
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            </div>

            {/* Center: Main Controls */}
            <div className="flex items-center gap-3">

                {/* Mic Toggle */}
                <TrackToggle
                    source={Track.Source.Microphone}
                    showIcon={false}
                    className={`${buttonBase} ${isMicrophoneEnabled ? buttonActive : buttonInactive}`}
                >
                    {isMicrophoneEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </TrackToggle>

                {/* Camera Toggle */}
                <TrackToggle
                    source={Track.Source.Camera}
                    showIcon={false}
                    className={`${buttonBase} ${isCameraEnabled ? buttonActive : buttonInactive}`}
                >
                    {isCameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </TrackToggle>

                {/* Caption (Mock) */}
                {/* <button className={`${buttonBase} ${buttonActive} hidden sm:flex`} title="Turn on captions">
            <Captions size={20} />
        </button> */}

                {/* Hand Raise */}
                <button
                    className={`${buttonBase} ${isHandRaised ? buttonSpecial : buttonActive} hidden sm:flex`}
                    title={isHandRaised ? "Lower hand" : "Raise hand"}
                    onClick={toggleHandRaise}
                >
                    <Hand size={20} />
                </button>

                {/* Local Record */}
                <button
                    className={`${buttonBase} ${isRecording ? 'bg-red-600 animate-pulse' : buttonActive} hidden sm:flex items-center gap-2 !w-max px-4`}
                    onClick={isRecording ? stopRecording : startRecording}
                    title={isRecording ? "Stop recording" : "Record locally (Free)"}
                >
                    <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
                    <span className="text-xs font-bold uppercase tracking-tighter">
                        {isRecording ? formatTime(recordingTime) : 'REC'}
                    </span>
                </button>

                {/* Screen Share */}
                <span onClick={(e) => {
                    if (screenShareLocked && !isLocalAdmin) {
                        e.stopPropagation();
                        alert("Screen sharing is currently restricted to hosts.");
                    }
                }}>
                    <TrackToggle
                        source={Track.Source.ScreenShare}
                        showIcon={false}
                        className={`${buttonBase} ${isScreenShareEnabled ? buttonSpecial : (screenShareLocked && !isLocalAdmin ? 'bg-zinc-800 opacity-50 cursor-not-allowed' : buttonActive)}`}
                        disabled={screenShareLocked && !isLocalAdmin}
                    >
                        {isScreenShareEnabled ? <MonitorOff size={20} /> : <Monitor size={20} />}
                    </TrackToggle>
                </span>

                {/* More Options */}
                {/* More Options Dropdown */}
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button
                            className={`${buttonBase} ${buttonActive} hidden sm:flex`}
                            title="More options"
                        >
                            <MoreVertical size={20} />
                        </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            className="bg-zinc-800 rounded-xl shadow-2xl p-2 min-w-[200px] border border-zinc-700 animate-in slide-in-from-bottom-2 duration-200 mb-4 z-[200]"
                            sideOffset={10}
                            align="center"
                        >
                            <DropdownMenu.Item
                                className="flex items-center gap-3 p-3 hover:bg-zinc-700 rounded-lg text-white text-sm cursor-pointer outline-none transition-colors"
                                onClick={() => alert("Layout switching currently handled automatically by speaker focus.")}
                            >
                                <LayoutGrid size={18} />
                                Change layout
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                className="flex items-center gap-3 p-3 hover:bg-zinc-700 rounded-lg text-white text-sm cursor-pointer outline-none transition-colors"
                                onClick={toggleFullScreen}
                            >
                                <Maximize size={18} />
                                Full screen
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="h-px bg-zinc-700 my-1" />
                            <DropdownMenu.Item
                                className="flex items-center gap-3 p-3 hover:bg-zinc-700 rounded-lg text-white text-sm cursor-pointer outline-none transition-colors"
                                onClick={() => setSettingsOpen(true)}
                            >
                                <Settings size={18} />
                                Settings
                            </DropdownMenu.Item>

                            {isLocalAdmin && (
                                <>
                                    <DropdownMenu.Separator className="h-px bg-zinc-700 my-1" />
                                    <DropdownMenu.Item
                                        className="flex items-center justify-between p-3 hover:bg-zinc-700 rounded-lg text-white text-sm cursor-pointer outline-none transition-colors"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleScreenShareLock();
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Monitor size={18} className={screenShareLocked ? 'text-red-400' : 'text-zinc-400'} />
                                            <span>Screen share {screenShareLocked ? 'locked' : 'unlocked'}</span>
                                        </div>
                                        <div className={`w-8 h-4 rounded-full transition-colors relative ${screenShareLocked ? 'bg-red-500' : 'bg-zinc-600'}`}>
                                            <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${screenShareLocked ? 'right-1' : 'left-1'}`} />
                                        </div>
                                    </DropdownMenu.Item>
                                </>
                            )}
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>

                {/* End Call / Host Controls */}
                {isHost ? (
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <div className="bg-red-600 hover:bg-red-700 text-white rounded-full w-20 h-10 flex items-center justify-center ml-2 transition-colors shadow-lg cursor-pointer gap-1 px-3">
                                <PhoneOff size={18} fill="currentColor" />
                                <ChevronDown size={14} />
                            </div>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                className="bg-zinc-800 rounded-xl shadow-2xl p-2 min-w-[180px] border border-zinc-700 animate-in slide-in-from-bottom-2 duration-200 mb-4 z-[200]"
                                sideOffset={10}
                                align="end"
                            >
                                <DropdownMenu.Item
                                    className="flex items-center gap-3 p-3 hover:bg-zinc-700 rounded-lg text-white text-sm cursor-pointer outline-none transition-colors"
                                    onClick={async () => {
                                        await exportMeetingSummary();
                                        room.disconnect();
                                        window.location.href = '/';
                                    }}
                                >
                                    <div className="bg-zinc-700 p-1.5 rounded-full">
                                        <X size={14} />
                                    </div>
                                    Leave meeting
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    className="flex items-center gap-3 p-3 hover:bg-red-500/10 text-red-500 rounded-lg text-sm cursor-pointer outline-none transition-colors"
                                    onClick={async () => {
                                        if (window.confirm("End meeting for everyone?")) {
                                            const encoder = new TextEncoder();
                                            await localParticipant.publishData(encoder.encode(JSON.stringify({ action: 'end' })), {
                                                reliable: true,
                                                topic: 'end_session'
                                            });
                                            await exportMeetingSummary();
                                            room.disconnect();
                                            window.location.href = '/';
                                        }
                                    }}
                                >
                                    <div className="bg-red-500 p-1.5 rounded-full text-white">
                                        <PhoneOff size={14} fill="currentColor" />
                                    </div>
                                    End meeting for all
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                ) : (
                    <DisconnectButton
                        onClick={async () => {
                            await exportMeetingSummary();
                            room.disconnect();
                            window.location.href = '/';
                        }}
                    >
                        <div className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-10 flex items-center justify-center ml-2 transition-colors shadow-lg">
                            <PhoneOff size={20} fill="currentColor" />
                        </div>
                    </DisconnectButton>
                )}

            </div>

            {/* Right: Side Actions */}
            <div className="hidden md:flex items-center gap-3 justify-end min-w-[200px]">
                <button
                    className={`p-3 transition-colors ${activeTab === 'notes' ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}`}
                    title="Notes"
                    onClick={onToggleNotes}
                >
                    <StickyNote size={20} />
                </button>
                <button
                    className={`p-3 transition-colors relative group/chat ${activeTab === 'chat' ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}`}
                    title="Chat"
                    onClick={onToggleChat}
                >
                    <div className={isRinging ? 'animate-ring' : ''}>
                        <MessageSquare size={20} />
                    </div>
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-zinc-900 animate-in zoom-in duration-200">
                            {unreadCount}
                        </span>
                    )}
                </button>
                <button
                    className={`p-3 transition-colors ${activeTab === 'participants' ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}`}
                    title="People"
                    onClick={onToggleUsers}
                >
                    <Users size={20} />
                </button>
            </div>
            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
    );
}
