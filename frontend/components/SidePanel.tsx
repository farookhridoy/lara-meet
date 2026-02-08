
'use client';

import { useChat, useParticipants, useRoomContext } from '@livekit/components-react';
import { X, Send, User, MicOff, Trash2, MoreVertical, Hand, Mic, ChevronDown, Check, Paperclip, File as FileIcon, Download, Eye, Loader2, Shield, ShieldCheck } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { RemoteParticipant, Track } from 'livekit-client';

interface SidePanelProps {
    activeTab: 'chat' | 'participants' | 'notes' | null;
    onClose: () => void;
    onTabChange?: (tab: 'chat' | 'participants' | 'notes') => void;
}

export default function SidePanel({ activeTab, onClose, onTabChange }: SidePanelProps) {
    const { chatMessages, send } = useChat();
    const participants = useParticipants();
    const [message, setMessage] = useState('');
    const [recipientId, setRecipientId] = useState<string | null>(null); // null = Everyone
    const [isUploading, setIsUploading] = useState(false);
    const [notes, setNotes] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const room = useRoomContext();
    const [localMeta, setLocalMeta] = useState<any>({});
    const [requests, setRequests] = useState<any[]>([]);
    const [privateMessages, setPrivateMessages] = useState<any[]>([]);

    useEffect(() => {
        if (room.localParticipant.metadata) {
            try { setLocalMeta(JSON.parse(room.localParticipant.metadata)); } catch { }
        }
    }, [room.localParticipant.metadata]);

    const isLocalAdmin = localMeta.is_host || localMeta.is_cohost;

    useEffect(() => {
        setMounted(true);
        const savedNotes = localStorage.getItem('meeting_notes');
        if (savedNotes) setNotes(savedNotes);
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, privateMessages, activeTab]);

    useEffect(() => {
        const handleData = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
            if (topic === 'private_chat') {
                try {
                    const str = new TextDecoder().decode(payload);
                    const data = JSON.parse(str);
                    setPrivateMessages(prev => [...prev, {
                        message: data.message,
                        timestamp: data.timestamp,
                        from: participant,
                        isPrivate: true
                    }]);
                } catch (e) { }
            }

            if (topic === 'join_request' && (localMeta.is_host || localMeta.is_cohost)) {
                try {
                    const data = JSON.parse(new TextDecoder().decode(payload));

                    // Play dingdong sound
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    audio.play().catch(e => console.log("Audio play blocked by browser:", e));

                    setRequests(prev => {
                        if (prev.find(r => r.identity === participant?.identity)) return prev;
                        return [...prev, { identity: participant?.identity, name: data.name || participant?.name || 'Anonymous' }];
                    });
                } catch (e) { }
            }
        };
        room.on('dataReceived', handleData);
        return () => { room.off('dataReceived', handleData); };
    }, [room, localMeta]);

    const handleCoHostAction = async (participantIdentity: string, make: boolean) => {
        const encoder = new TextEncoder();
        const payload = JSON.stringify({ action: make ? 'promote' : 'demote' });
        await room.localParticipant.publishData(encoder.encode(payload), {
            reliable: true,
            topic: 'cohost_action',
            destinationIdentities: [participantIdentity]
        });
    };

    const handleRequest = async (identity: string, status: 'accepted' | 'hold') => {
        const encoder = new TextEncoder();
        const payload = JSON.stringify({ status, message: status === 'hold' ? "The host has put you on hold. Please wait..." : "" });
        await room.localParticipant.publishData(encoder.encode(payload), {
            reliable: true,
            destinationIdentities: [identity],
            topic: 'join_response'
        });

        if (status === 'accepted') {
            setRequests(prev => prev.filter(r => r.identity !== identity));
        }
    };

    const onSend = async (customMessage?: string, attachment?: any) => {
        const textToSend = customMessage || message;
        if (textToSend.trim() || attachment) {
            const msgData = attachment
                ? JSON.stringify({ type: 'attachment', ...attachment, message: textToSend })
                : textToSend;

            if (recipientId) {
                const payload = JSON.stringify({
                    message: msgData,
                    timestamp: Date.now(),
                    isPrivate: true
                });
                const encoder = new TextEncoder();
                await room.localParticipant.publishData(encoder.encode(payload), {
                    reliable: true,
                    destinationIdentities: [recipientId],
                    topic: 'private_chat'
                });

                setPrivateMessages(prev => [...prev, {
                    message: msgData,
                    timestamp: Date.now(),
                    from: room.localParticipant,
                    isPrivate: true
                }]);
            } else {
                await send(msgData);
            }
            if (!attachment) setMessage('');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('room_id', room.name);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const resp = await fetch(`${apiUrl}/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await resp.json();
            if (data.success) {
                await onSend('', {
                    name: data.name,
                    url: data.url,
                    size: data.size,
                    fileType: data.type
                });
            } else {
                alert('Upload failed: ' + data.error);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('File upload failed.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleHostAction = async (action: 'mute' | 'remove', identity: string, trackSid?: string) => {
        try {
            let finalTrackSid = trackSid;

            // If muting and no trackSid provided, try to find the microphone track
            if (action === 'mute' && !finalTrackSid) {
                const participant = participants.find(p => p.identity === identity);
                if (participant) {
                    const micTrackPub = participant.getTrackPublication(Track.Source.Microphone);
                    if (micTrackPub) {
                        finalTrackSid = micTrackPub.trackSid;
                    }
                }
            }

            await fetch('/api/host-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room: room.name,
                    identity,
                    action,
                    trackSid: finalTrackSid
                })
            });
        } catch (e) {
            console.error('Host action failed', e);
        }
    };

    const askToUnmute = async (identity: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({ action: 'ask_unmute' }));
        await room.localParticipant.publishData(data, {
            reliable: true,
            destinationIdentities: [identity],
            topic: 'ask_unmute'
        });
    };

    if (!mounted) return null;
    if (!activeTab) return null;

    const allMessages = [...chatMessages, ...privateMessages].sort((a, b) => a.timestamp - b.timestamp);

    return (
        <div
            data-side-panel={activeTab ? 'open' : 'closed'}
            className="fixed right-4 top-4 bottom-24 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-[40] animate-in slide-in-from-right-4 duration-300"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h3 className="text-white font-medium text-lg capitalize">
                    {activeTab === 'chat' ? 'In-call messages' : activeTab === 'notes' ? 'My Notes' : 'People'}
                </h3>
                <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                {activeTab === 'chat' && (
                    <div className="flex flex-col gap-4">
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
                                        </div>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                        </div>

                        {allMessages.length === 0 && (
                            <div className="text-center text-zinc-500 text-sm mt-10">
                                No messages yet.
                            </div>
                        )}
                        {allMessages.map((msg) => {
                            let content = msg.message;
                            let attachment: any = null;
                            try {
                                if (content.startsWith('{')) {
                                    const parsed = JSON.parse(content);
                                    if (parsed.type === 'attachment') {
                                        content = parsed.message;
                                        attachment = parsed;
                                    }
                                }
                            } catch (e) { }

                            return (
                                <div key={msg.timestamp} className="flex flex-col gap-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-semibold text-xs text-white">
                                            {msg.from?.identity === room.localParticipant.identity ? 'You' : (msg.from?.name || msg.from?.identity || 'User')}
                                            {msg.isPrivate && <span className="text-red-400 ml-1 italic text-[10px]">(Private)</span>}
                                        </span>
                                        <span className="text-[10px] text-zinc-500">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`p-2 rounded-lg rounded-tl-none text-sm break-words ${msg.isPrivate ? 'bg-zinc-800 border border-red-900/50 text-red-100' : 'bg-zinc-800 text-zinc-200'}`}>
                                        {content && <div className="mb-2">{content}</div>}

                                        {attachment && (
                                            <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-3 flex items-center gap-3 mt-1 group animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-400 shrink-0">
                                                    {attachment.fileType?.startsWith('image/') ? <Eye size={20} /> : <FileIcon size={20} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-medium text-white truncate">{attachment.name}</div>
                                                    <div className="text-[10px] text-zinc-500">{(attachment.size / 1024).toFixed(1)} KB</div>
                                                </div>
                                                <a
                                                    href={attachment.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {activeTab === 'participants' && (
                    <div className="flex flex-col gap-3">
                        {isLocalAdmin && requests.length > 0 && (
                            <div className="mb-6 space-y-3">
                                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                    <Shield size={12} />
                                    Waiting in lobby ({requests.length})
                                </div>
                                {requests.map(req => (
                                    <div key={req.identity} className="bg-blue-600/5 border border-blue-500/20 rounded-xl p-3 flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                                {req.name[0].toUpperCase()}
                                            </div>
                                            <span className="text-sm text-white font-medium truncate flex-1">{req.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleRequest(req.identity, 'accepted')} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">Accept</button>
                                            <button onClick={() => handleRequest(req.identity, 'hold')} className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold rounded-lg transition-colors">Hold</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">In Meeting ({participants.length})</div>
                        {participants.map((p) => {
                            const pMeta = p.metadata ? JSON.parse(p.metadata) : {};
                            const isPHost = pMeta.is_host;
                            const isPCoHost = pMeta.is_cohost;

                            return (
                                <div key={p.identity} className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-lg group transition-colors">
                                    <div className="relative shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/20">
                                            {p.name?.[0]?.toUpperCase() || p.identity?.[0]?.toUpperCase()}
                                        </div>
                                        {p.isLocal && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-zinc-900 rounded-full" title="You" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-sm text-white truncate font-medium">
                                                {p.name || p.identity} {p.isLocal && '(You)'}
                                            </span>
                                            {isPHost && <Shield size={12} className="text-blue-400 fill-blue-400/20 shrink-0" />}
                                            {isPCoHost && <ShieldCheck size={12} className="text-zinc-400 fill-zinc-400/20 shrink-0" />}
                                            {!p.isMicrophoneEnabled && <MicOff size={12} className="text-red-500 shrink-0" />}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                                            {p.isSpeaking ? (
                                                <span className="text-green-500 flex items-center gap-0.5"><Mic size={8} /> Speaking</span>
                                            ) : (
                                                <span>{p.isMicrophoneEnabled ? 'Active' : 'Muted'}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {!p.isLocal && (
                                            <button
                                                onClick={() => {
                                                    setRecipientId(p.identity);
                                                    onTabChange?.('chat');
                                                }}
                                                className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Send private message"
                                            >
                                                <Send size={14} />
                                            </button>
                                        )}

                                        {!p.isLocal && isLocalAdmin && (
                                            <DropdownMenu.Root>
                                                <DropdownMenu.Trigger asChild>
                                                    <button className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-all outline-none">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </DropdownMenu.Trigger>
                                                <DropdownMenu.Portal>
                                                    <DropdownMenu.Content className="min-w-[180px] bg-zinc-800 rounded-xl shadow-2xl border border-zinc-700 p-1.5 z-[110] animate-in fade-in zoom-in-95 duration-100" align="end" sideOffset={5}>
                                                        <DropdownMenu.Item className="text-white text-xs flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 rounded-lg cursor-pointer outline-none transition-colors" onClick={() => askToUnmute(p.identity)}>
                                                            <Mic size={14} className="text-zinc-400" />
                                                            Ask to unmute
                                                        </DropdownMenu.Item>
                                                        <DropdownMenu.Item className="text-red-400 text-xs flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 rounded-lg cursor-pointer outline-none transition-colors" onClick={() => handleHostAction('mute', p.identity)}>
                                                            <MicOff size={14} />
                                                            Mute participant
                                                        </DropdownMenu.Item>

                                                        {localMeta.is_host && (
                                                            <>
                                                                <DropdownMenu.Separator className="h-px bg-zinc-700 my-1" />
                                                                <DropdownMenu.Item
                                                                    className="text-white text-xs flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 rounded-lg cursor-pointer outline-none transition-colors"
                                                                    onClick={() => handleCoHostAction(p.identity, !isPCoHost)}
                                                                >
                                                                    <ShieldCheck size={14} className={isPCoHost ? "text-red-400" : "text-blue-400"} />
                                                                    {isPCoHost ? 'Remove Co-host' : 'Make Co-host'}
                                                                </DropdownMenu.Item>
                                                            </>
                                                        )}

                                                        <DropdownMenu.Separator className="h-px bg-zinc-700 my-1" />
                                                        <DropdownMenu.Item className="text-red-500 text-xs flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 rounded-lg cursor-pointer outline-none transition-colors font-semibold" onClick={() => handleHostAction('remove', p.identity)}>
                                                            <Trash2 size={14} />
                                                            Remove from call
                                                        </DropdownMenu.Item>
                                                    </DropdownMenu.Content>
                                                </DropdownMenu.Portal>
                                            </DropdownMenu.Root>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="flex flex-col h-full gap-4">
                        <textarea
                            value={notes || ''}
                            onChange={(e) => { setNotes(e.target.value); localStorage.setItem('meeting_notes', e.target.value); }}
                            placeholder="Start typing your notes here..."
                            className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 text-sm text-zinc-200 focus:outline-none resize-none min-h-[300px]"
                        />
                    </div>
                )}
            </div>

            {activeTab === 'chat' && (
                <div className="p-4 border-t border-zinc-800">
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className={`p-2 rounded-lg transition-colors ${isUploading ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                            title="Attach file"
                        >
                            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                        </button>
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={message || ''}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onSend()}
                                placeholder={isUploading ? "Uploading file..." : "Send a message"}
                                disabled={isUploading}
                                className="w-full bg-zinc-800 border-none rounded-full py-2.5 px-4 pr-12 text-sm text-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-50"
                            />
                            <button
                                onClick={() => onSend()}
                                disabled={isUploading || (!message.trim())}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-blue-300 disabled:text-zinc-600 transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
