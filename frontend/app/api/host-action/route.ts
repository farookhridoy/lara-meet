
import { RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { room, identity, action, trackSid } = await req.json();

    if (!room || !identity || !action) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const roomService = new RoomServiceClient(
        process.env.NEXT_PUBLIC_LIVEKIT_URL!,
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!
    );

    try {
        switch (action) {
            case 'mute':
                await roomService.mutePublishedTrack(room, identity, trackSid, true);
                break;
            case 'remove':
                await roomService.removeParticipant(room, identity);
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
