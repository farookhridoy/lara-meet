
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');

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
            <button
              onClick={createRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              New meeting
            </button>
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
    </div>
  );
}
