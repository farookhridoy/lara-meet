
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
    Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';
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

    const [time, setTime] = useState('');
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isRinging, setIsRinging] = useState(false);
    const { isRecording, recordingTime, startRecording, stopRecording } = useLocalRecording();
    const { chatMessages } = useChat();
    const room = useRoomContext();

    useEffect(() => {
        if (localParticipant.metadata) {
            try {
                const meta = JSON.parse(localParticipant.metadata);
                setIsHandRaised(!!meta.handRaised);
            } catch { setIsHandRaised(false); }
        }
    }, [localParticipant.metadata]);

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

    const exportMeetingSummary = () => {
        const notes = localStorage.getItem('meeting_notes') || 'No notes taken.';
        const chat = chatMessages.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.from?.name || 'User'}: ${m.message}`).join('\n');

        const summary = `
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

        const blob = new Blob([summary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-summary-${room.name}.txt`;
        a.click();

        // Cleanup as requested
        localStorage.removeItem('meeting_notes');
    };

    // Common button styles
    const buttonBase = "p-3 rounded-full text-white transition-all duration-200 flex items-center justify-center h-12 w-12";
    const buttonActive = "bg-zinc-700/80 hover:bg-zinc-600 border border-zinc-600";
    const buttonInactive = "bg-red-500/90 hover:bg-red-600 text-white border-none shadow-red-500/20 shadow-lg";
    const buttonSpecial = "bg-blue-300 text-blue-900 hover:bg-blue-200";

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-6 z-[100]">

            {/* Left: Time / Info */}
            <div className="hidden md:flex items-center gap-4 text-white min-w-[200px]">
                <span className="font-medium text-sm text-zinc-300">
                    {time}
                </span>
                <span className="border-l border-zinc-700 h-4 mx-2"></span>
                <span className="text-sm font-medium text-zinc-400 truncate max-w-[150px]">
                    {/* Room Name can be fetched if needed */}
                    Meeting
                </span>
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
                <TrackToggle
                    source={Track.Source.ScreenShare}
                    showIcon={false}
                    className={`${buttonBase} ${isScreenShareEnabled ? buttonSpecial : buttonActive}`}
                    title="Present now"
                >
                    {isScreenShareEnabled ? <MonitorOff size={20} /> : <Monitor size={20} />}
                </TrackToggle>

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
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>

                {/* End Call */}
                <DisconnectButton
                    onClick={() => {
                        exportMeetingSummary();
                    }}
                >
                    <div className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-10 flex items-center justify-center ml-2 transition-colors shadow-lg">
                        <PhoneOff size={20} fill="currentColor" />
                    </div>
                </DisconnectButton>

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
