
'use client';

import { useChat, useParticipants, useRoomContext } from '@livekit/components-react';
import { X, Send, User, MicOff, Trash2, MoreVertical, Hand, Mic, ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { RemoteParticipant, Track } from 'livekit-client';

interface SidePanelProps {
    activeTab: 'chat' | 'participants' | null;
    onClose: () => void;
    onTabChange?: (tab: 'chat' | 'participants') => void;
}

export default function SidePanel({ activeTab, onClose, onTabChange }: SidePanelProps) {
    const { chatMessages, send } = useChat();
    const participants = useParticipants();
    const [message, setMessage] = useState('');
    const [recipientId, setRecipientId] = useState<string | null>(null); // null = Everyone
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const room = useRoomContext();

    // Scroll to bottom of chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, activeTab]);

    const onSend = async () => {
        if (message.trim()) {
            if (recipientId) {
                // Determine destination identity
                // Assuming identity is sufficient. LiveKit useChat send options has destinationIdentities
                await send(message); // Note: useChat's send doesn't expose destination directly in current hook version often, let's check
                // For now, if useChat send(msg) doesn't take options, we fallback to DataPacket or just label it.
                // Actually the standard useChat hook send function usually is (message: string) => Promise<ChatMessage>.
                // If that's the case, we might need a custom send or publish data.
                // Let's assume we use standard chat but if we want PRIVATE it's tricky with just useChat hook unless we filter.
                // Better approach: Use localParticipant.publishData for private chat if the hook doesn't support it, 
                // BUT to integrate with 'chatMessages' list is hard.
                // Let's try to pass payload if possible or standard text. 
                // If useChat doesn't support private, we simulate it or use data channel.
                // Let's assume for this task we use DataChannel for private messages or try to stick to public but labeled? No, user asked for private.
                // Let's use room.localParticipant.publishData and client-side filtering? 
                // Actually, let's use the 'send' from useChat but we might not be able to direct it.
                // Use room.localParticipant.publishData for private messages.

                const payload = JSON.stringify({ message, timestamp: Date.now(), isPrivate: true });
                const encoder = new TextEncoder();
                await room.localParticipant.publishData(encoder.encode(payload), {
                    reliable: true,
                    destinationIdentities: [recipientId],
                    topic: 'private_chat'
                });

                // Add to local view
                setPrivateMessages(prev => [...prev, {
                    message,
                    timestamp: Date.now(),
                    from: room.localParticipant,
                    isPrivate: true
                }]);
            } else {
                await send(message);
            }
            setMessage('');
        }
    };

    // We need to listen to 'private_chat' topic to add to messages? 
    // LiveKit useChat hook by default listens to data packets. If we use same topic?
    // useChat typically listens to 'lk-chat-topic'. 
    // If we rely on useChat, we can't easily do private.
    // Let's stick to public for now OR just Prefix for MVP if strictly required?
    // "private message feature need to enable"
    // I will try to use the standard TextDecoder approach and a separate state merged?
    // Let's do: when sending private, publish to specific user. Listener adds it.

    // Actually, `send` from useChat might allow 2nd arg? TypeScript will tell.
    // If not, I'll stick to publishing data.

    // QUICK FIX: For this step, I will utilize a standard "To Everyone" vs "To [Name]" UI.
    // And implement onSend logic.
    // If `send` accepts generic options, good. If not, I'll use publishData.
    // Let's assume I need to handle it.

    // To make it simple and reliable:
    // 1. Add `privateMessages` state.
    // 2. Merge with `chatMessages` for display.
    // 3. Listener for 'private_chat'.

    const [privateMessages, setPrivateMessages] = useState<any[]>([]);

    useEffect(() => {
        const handleData = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
            if (topic === 'private_chat') {
                const str = new TextDecoder().decode(payload);
                const data = JSON.parse(str);
                setPrivateMessages(prev => [...prev, {
                    message: data.message,
                    timestamp: data.timestamp,
                    from: participant,
                    isPrivate: true
                }]);
            }
        };
        room.on('dataReceived', handleData);
        return () => { room.off('dataReceived', handleData); };
    }, [room]);

    // Derived messages
    const allMessages = [...chatMessages, ...privateMessages].sort((a, b) => a.timestamp - b.timestamp);

    const handleHostAction = async (action: 'mute' | 'remove', identity: string, trackSid?: string) => {
        try {
            await fetch('/api/host-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room: room.name,
                    identity,
                    action,
                    trackSid
                })
            });
        } catch (e) {
            console.error('Host action failed', e);
        }
    };

    const askToUnmute = async (identity: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({ action: 'ask_unmute' }));
        // Only works if data channel is supported and user is connected
        await room.localParticipant.publishData(data, {
            reliable: true,
            destinationIdentities: [identity],
            topic: 'ask_unmute'
        });
    };

    if (!activeTab) return null;

    return (
        <div
            data-side-panel={activeTab ? 'open' : 'closed'}
            className="fixed right-4 top-4 bottom-24 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-[40] animate-in slide-in-from-right-4 duration-300"
        >

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h3 className="text-white font-medium text-lg capitalize">
                    {activeTab === 'chat' ? 'In-call messages' : 'People'}
                </h3>
                <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                    <div className="flex flex-col gap-4">
                        {/* Recipient Selector */}
                        <div className="flex items-center justify-between bg-zinc-800 p-3 rounded-xl">
                            <span className="text-zinc-400 text-sm font-medium">To:</span>
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                    <button className="flex items-center gap-2 text-sm font-medium text-white hover:bg-zinc-700/50 px-3 py-1.5 rounded-lg transition-colors outline-none max-w-[200px]">
                                        {recipientId ? (
                                            <span className="text-blue-400 flex items-center gap-2 truncate">
                                                <span className="truncate">{participants.find(p => p.identity === recipientId)?.name || recipientId}</span>
                                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 whitespace-nowrap">Private</span>
                                            </span>
                                        ) : (
                                            <span>Everyone</span>
                                        )}
                                        <ChevronDown size={14} className="text-zinc-500 shrink-0" />
                                    </button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                    <DropdownMenu.Content className="min-w-[200px] bg-zinc-800 rounded-xl shadow-2xl border border-zinc-700 p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-100" align="end" sideOffset={5}>
                                        <DropdownMenu.Item
                                            className="text-white text-sm flex items-center justify-between px-3 py-2 hover:bg-zinc-700 rounded-lg cursor-pointer outline-none transition-colors mb-1"
                                            onClick={() => setRecipientId(null)}
                                        >
                                            Everyone
                                            {!recipientId && <Check size={14} className="text-blue-400" />}
                                        </DropdownMenu.Item>

                                        <DropdownMenu.Label className="text-xs font-semibold text-zinc-500 px-3 py-1 uppercase tracking-wider">
                                            Participants
                                        </DropdownMenu.Label>

                                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                            {participants.filter(p => !p.isLocal).map(p => (
                                                <DropdownMenu.Item
                                                    key={p.identity}
                                                    className="text-white text-sm flex items-center justify-between px-3 py-2 hover:bg-zinc-700 rounded-lg cursor-pointer outline-none transition-colors"
                                                    onClick={() => setRecipientId(p.identity)}
                                                >
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                            {p.name?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <span className="truncate">{p.name || p.identity}</span>
                                                    </div>
                                                    {recipientId === p.identity && <Check size={14} className="text-blue-400" />}
                                                </DropdownMenu.Item>
                                            ))}
                                            {participants.filter(p => !p.isLocal).length === 0 && (
                                                <div className="text-zinc-500 text-xs px-3 py-2 italic text-center">No other participants</div>
                                            )}
                                        </div>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                        </div>

                        {allMessages.length === 0 && (
                            <div className="text-center text-zinc-500 text-sm mt-10">
                                No messages yet. <br /> Messages can only be seen by people in the call.
                            </div>
                        )}
                        {allMessages.map((msg) => (
                            <div key={msg.timestamp} className="flex flex-col gap-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-semibold text-xs text-white">
                                        {msg.from?.identity === room.localParticipant.identity ? 'You' : (msg.from?.name || msg.from?.identity || 'UserId')}
                                        {/* @ts-ignore */}
                                        {msg.isPrivate && <span className="text-red-400 ml-1 italic">(Private)</span>}
                                    </span>
                                    <span className="text-[10px] text-zinc-500">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className={`p-2 rounded-lg rounded-tl-none text-sm break-words ${
                                    /* @ts-ignore */
                                    msg.isPrivate ? 'bg-zinc-800 border border-red-900/50 text-red-100' : 'bg-zinc-800 text-zinc-200'
                                    }`}>
                                    {msg.message}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Participants Tab */}
                {activeTab === 'participants' && (
                    <div className="flex flex-col gap-3">
                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                            In Meeting ({participants.length})
                        </div>
                        {participants.map((p) => (
                            <div key={p.identity} className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-lg transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                    {p.name?.[0]?.toUpperCase() || p.identity?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-white font-medium truncate flex items-center gap-2">
                                        {p.name || p.identity}
                                        {p.isLocal && <span className="text-zinc-500 font-normal">(You)</span>}
                                    </div>
                                </div>
                                <div className="flex gap-1 text-zinc-400 items-center">
                                    {(() => {
                                        try {
                                            const meta = p.metadata ? JSON.parse(p.metadata) : {};
                                            return meta.handRaised ? <Hand size={16} className="text-yellow-500 mr-2" /> : null;
                                        } catch { return null; }
                                    })()}

                                    {!p.isMicrophoneEnabled ? (
                                        <div className="p-1"><div className="w-2 h-2 bg-red-500 rounded-full" title="Muted"></div></div>
                                    ) : null}

                                    {/* Host Controls Menu */}
                                    {!p.isLocal && (
                                        <DropdownMenu.Root>
                                            <DropdownMenu.Trigger asChild>
                                                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded-full transition-all focus:opacity-100 outline-none">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </DropdownMenu.Trigger>
                                            <DropdownMenu.Portal>
                                                <DropdownMenu.Content className="min-w-[170px] bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 p-1 z-[100] animate-in fade-in zoom-in-95 duration-100" sideOffset={5} align="end">

                                                    {/* Ask to Unmute */}
                                                    {!p.isMicrophoneEnabled && (
                                                        <DropdownMenu.Item
                                                            className="text-white text-sm flex items-center gap-2 px-2 py-2 hover:bg-zinc-700/50 rounded cursor-pointer outline-none"
                                                            onClick={() => askToUnmute(p.identity)}
                                                        >
                                                            <Mic size={14} className="text-blue-400" /> Ask to Unmute
                                                        </DropdownMenu.Item>
                                                    )}

                                                    {/* Mute (Active only if unmuted) */}
                                                    {p.isMicrophoneEnabled && (
                                                        <DropdownMenu.Item
                                                            className="text-white text-sm flex items-center gap-2 px-2 py-2 hover:bg-zinc-700/50 rounded cursor-pointer outline-none"
                                                            onClick={() => {
                                                                const pub = p.getTrackPublication(Track.Source.Microphone);
                                                                if (pub?.trackSid) {
                                                                    handleHostAction('mute', p.identity, pub.trackSid);
                                                                }
                                                            }}
                                                        >
                                                            <MicOff size={14} className="text-red-400" /> Mute Participant
                                                        </DropdownMenu.Item>
                                                    )}

                                                    <DropdownMenu.Separator className="h-px bg-zinc-700 my-1" />

                                                    <DropdownMenu.Item
                                                        className="text-white text-sm flex items-center gap-2 px-2 py-2 hover:bg-zinc-700/50 rounded cursor-pointer outline-none"
                                                        onClick={() => handleHostAction('remove', p.identity)}
                                                    >
                                                        <Trash2 size={14} /> Remove from call
                                                    </DropdownMenu.Item>
                                                    <DropdownMenu.Separator className="h-px bg-zinc-700 my-1" />
                                                    <DropdownMenu.Item
                                                        className="text-white text-sm flex items-center gap-2 px-2 py-2 hover:bg-zinc-700/50 rounded cursor-pointer outline-none"
                                                        onClick={() => {
                                                            setRecipientId(p.identity);
                                                            if (onTabChange) onTabChange('chat');
                                                        }}
                                                    >
                                                        <Send size={14} className="text-zinc-400" /> Send private message
                                                    </DropdownMenu.Item>
                                                </DropdownMenu.Content>
                                            </DropdownMenu.Portal>
                                        </DropdownMenu.Root>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Chat Input (Only for Chat Tab) */}
            {activeTab === 'chat' && (
                <div className="p-4 border-t border-zinc-800 bg-zinc-900 rounded-b-2xl">
                    <div className="relative">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onSend()}
                            placeholder={recipientId ? "Send private message..." : "Send a message"}
                            className="w-full bg-zinc-800 border-none rounded-full py-3 px-4 pr-12 text-sm text-white focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder-zinc-500"
                        />
                        <button
                            onClick={onSend}
                            disabled={!message.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-blue-300 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
