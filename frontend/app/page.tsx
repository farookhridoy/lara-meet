
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Video, Calendar, Plus, Keyboard, Info, Link as LinkIcon } from 'lucide-react';
import ScheduleMeeting from '@/components/ScheduleMeeting';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const createRoom = () => {
    const randomId = Math.random().toString(36).substring(7);
    window.location.href = `/room/${randomId}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white font-sans">
      <header className="absolute top-0 left-0 p-6 flex items-center justify-between w-full z-10">
        <div className="flex items-center space-x-2">
          <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
          </svg>
          <span className="text-xl font-medium text-gray-300">Google Meet Clone</span>
        </div>
        <div className="text-gray-400 text-sm">
          <span>{time} • {date}</span>
        </div>
      </header>

      <main className="flex flex-col md:flex-row items-center justify-center w-full max-w-7xl px-4 md:gap-16">
        <div className="flex-1 text-center md:text-left space-y-8 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-normal leading-tight">
            Premium video meetings. Now free for everyone.
          </h1>
          <p className="text-lg text-gray-400">
            We re-engineered the service we built for secure business meetings, Google Meet, to make it free and available for all.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={20} />
                  New meeting
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[240px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  align="start"
                  sideOffset={8}
                >
                  <DropdownMenu.Item
                    className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800/50 rounded-lg cursor-pointer outline-none transition-colors"
                    onClick={() => setShowSchedule(true)}
                  >
                    <LinkIcon size={18} className="text-zinc-500" />
                    Create a meeting for later
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800/50 rounded-lg cursor-pointer outline-none transition-colors"
                    onClick={createRoom}
                  >
                    <Plus size={18} className="text-zinc-500" />
                    Start an instant meeting
                  </DropdownMenu.Item>
                  <a
                    href="https://calendar.google.com/calendar/render?action=TEMPLATE"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <DropdownMenu.Item className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800/50 rounded-lg cursor-pointer outline-none transition-colors">
                      <Calendar size={18} className="text-zinc-500" />
                      Schedule in Google Calendar
                    </DropdownMenu.Item>
                  </a>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <div className="flex items-center gap-2 w-full sm:w-auto relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Enter a code or link"
                className="w-full sm:w-64 pl-10 pr-4 py-3 bg-transparent border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && roomCode && (window.location.href = `/room/${roomCode}`)}
              />
              {roomCode && (
                <Link
                  href={`/room/${roomCode}`}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 font-medium"
                >
                  Join
                </Link>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 w-full">
            <p className="text-gray-500 text-sm">
              <a href="#" className="underline hover:text-gray-300">Learn more</a> about Google Meet
            </p>
          </div>
        </div>

        {/* Hero Image / Carousel Placeholder */}
        <div className="flex-1 mt-12 md:mt-0 w-full max-w-lg aspect-square relative hidden md:flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="relative z-10 grid grid-cols-2 gap-4 p-4 border border-gray-800 bg-zinc-900/50 backdrop-blur-sm rounded-2xl shadow-xl">
            <div className="bg-zinc-800 rounded-lg aspect-video w-32 animate-pulse"></div>
            <div className="bg-zinc-800 rounded-lg aspect-video w-32 animate-pulse delay-75"></div>
            <div className="bg-zinc-800 rounded-lg aspect-video w-32 animate-pulse delay-150"></div>
            <div className="bg-zinc-800 rounded-lg aspect-video w-32 animate-pulse delay-300"></div>
            <div className="col-span-2 text-center text-sm text-gray-500 mt-2">Get a link you can share</div>
            <div className="col-span-2 text-xs text-gray-600 text-center">Click <strong>New meeting</strong> to get a link you can send to people needing to meet with you</div>
          </div>
        </div>
      </main>

      {showSchedule && (
        <ScheduleMeeting onClose={() => setShowSchedule(false)} />
      )}
    </div>
  );
}

