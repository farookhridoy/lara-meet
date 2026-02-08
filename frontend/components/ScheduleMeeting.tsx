
'use client';

import { useState } from 'react';
import { Calendar, Clock, Link as LinkIcon, X, Check, Copy } from 'lucide-react';

interface ScheduleMeetingProps {
    onClose: () => void;
}

export default function ScheduleMeeting({ onClose }: ScheduleMeetingProps) {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [scheduledMeeting, setScheduledMeeting] = useState<any>(null);
    const [isScheduling, setIsScheduling] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSchedule = async () => {
        if (!title || !date || !time) {
            alert('Please fill in all fields');
            return;
        }

        setIsScheduling(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const scheduledAt = `${date} ${time}`;

            const resp = await fetch(`${apiUrl}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    scheduled_at: scheduledAt
                })
            });

            const data = await resp.json();
            if (data.success) {
                setScheduledMeeting(data.meeting);
            } else {
                alert('Failed to schedule meeting');
            }
        } catch (error) {
            console.error('Schedule error:', error);
            alert('An error occurred');
        } finally {
            setIsScheduling(false);
        }
    };

    const getCalendarUrl = (type: 'google' | 'outlook') => {
        if (!scheduledMeeting) return '';

        const startTime = new Date(scheduledMeeting.scheduled_at).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const endTime = new Date(new Date(scheduledMeeting.scheduled_at).getTime() + 3600000).toISOString().replace(/-|:|\.\d\d\d/g, ""); // +1 hour
        const title = encodeURIComponent(scheduledMeeting.title);
        const details = encodeURIComponent(`Join meeting: ${window.location.origin}/room/${scheduledMeeting.room_id}`);

        if (type === 'google') {
            return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${window.location.origin}/room/${scheduledMeeting.room_id}`;
        }

        return ''; // Add more if needed
    };

    const copyToClipboard = () => {
        const link = `${window.location.origin}/room/${scheduledMeeting.room_id}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-medium text-white">Schedule meeting</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {!scheduledMeeting ? (
                        <>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Meeting title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Weekly Sync"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Date</label>
                                        <input
                                            type="date"
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all [color-scheme:dark]"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Time</label>
                                        <input
                                            type="time"
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all [color-scheme:dark]"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSchedule}
                                disabled={isScheduling || !title || !date || !time}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/10"
                            >
                                {isScheduling ? 'Scheduling...' : 'Schedule meeting'}
                            </button>
                        </>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-4">
                                <div className="bg-blue-500 p-2 rounded-lg">
                                    <Check className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">Meeting scheduled!</h3>
                                    <p className="text-zinc-400 text-sm">Your meeting is ready for {new Date(scheduledMeeting.scheduled_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 space-y-3">
                                    <p className="text-sm font-medium text-zinc-400">Meeting link</p>
                                    <div className="flex items-center gap-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                        <span className="flex-1 text-sm text-zinc-300 truncate">
                                            {window.location.origin}/room/{scheduledMeeting.room_id}
                                        </span>
                                        <button
                                            onClick={copyToClipboard}
                                            className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                                            title="Copy link"
                                        >
                                            {copied ? <Check size={18} /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <a
                                        href={getCalendarUrl('google')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 font-medium py-3 rounded-lg transition-colors"
                                    >
                                        <Calendar size={18} />
                                        Add to Google Calendar
                                    </a>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full text-zinc-400 hover:text-white transition-colors py-2 text-sm"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
