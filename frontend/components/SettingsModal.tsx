
import {
    useMediaDeviceSelect,
    useRoomContext
} from '@livekit/components-react';
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogClose } from '@radix-ui/react-dialog';
import { X, Mic, Video, Speaker, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    // We need to fetch devices for each kind
    const audioInput = useMediaDeviceSelect({ kind: 'audioinput' });
    const videoInput = useMediaDeviceSelect({ kind: 'videoinput' });
    const audioOutput = useMediaDeviceSelect({ kind: 'audiooutput' }); // Only works on supported browsers (Chrome/Edge)

    // Helper to render device list
    const DeviceSection = ({
        title,
        icon: Icon,
        devices,
        activeDeviceId,
        onSelect
    }: {
        title: string,
        icon: any,
        devices: MediaDeviceInfo[],
        activeDeviceId: string,
        onSelect: (id: string) => void
    }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-400 font-medium text-sm uppercase tracking-wider">
                <Icon size={16} />
                {title}
            </div>
            <div className="grid gap-2">
                {devices.map((device) => (
                    <button
                        key={device.deviceId}
                        onClick={() => onSelect(device.deviceId)}
                        className={`
                            flex items-center justify-between p-3 rounded-lg text-sm transition-all text-left
                            ${activeDeviceId === device.deviceId
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-transparent'}
                        `}
                    >
                        <span className="truncate pr-4">{device.label || `Device ${device.deviceId.slice(0, 5)}...`}</span>
                        {activeDeviceId === device.deviceId && <Check size={16} />}
                    </button>
                ))}
                {devices.length === 0 && (
                    <div className="text-zinc-500 text-sm italic p-2">No devices found</div>
                )}
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900">
                    <h2 className="text-xl font-semibold text-white">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">

                    <DeviceSection
                        title="Microphone"
                        icon={Mic}
                        devices={audioInput.devices}
                        activeDeviceId={audioInput.activeDeviceId}
                        onSelect={audioInput.setActiveMediaDevice}
                    />

                    <DeviceSection
                        title="Camera"
                        icon={Video}
                        devices={videoInput.devices}
                        activeDeviceId={videoInput.activeDeviceId}
                        onSelect={videoInput.setActiveMediaDevice}
                    />

                    {audioOutput.devices.length > 0 && (
                        <DeviceSection
                            title="Speakers"
                            icon={Speaker}
                            devices={audioOutput.devices}
                            activeDeviceId={audioOutput.activeDeviceId}
                            onSelect={audioOutput.setActiveMediaDevice}
                        />
                    )}

                </div>
            </div>
        </div>
    );
}
