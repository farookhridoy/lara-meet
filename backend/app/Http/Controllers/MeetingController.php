<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;


use App\Models\Meeting;
use App\Models\Attachment;
use Agence104\LiveKit\AccessToken;
use Agence104\LiveKit\AccessTokenOptions;
use Agence104\LiveKit\VideoGrant;
use Agence104\LiveKit\RoomServiceClient;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MeetingController extends Controller
{
    public function getToken(Request $request)
    {
        $request->validate([
            'room' => 'required|string',
            'username' => 'required|string',
        ]);

        $roomName = $request->query('room');
        $username = $request->query('username');
        $identity = $username . '_' . substr(bin2hex(random_bytes(5)), 0, 5);
        $isHost = $request->query('is_host') === 'true';

        $apiKey = env('LIVEKIT_API_KEY');
        $apiSecret = env('LIVEKIT_API_SECRET');

        $tokenOptions = (new AccessTokenOptions())
            ->setIdentity($identity)
            ->setName($username)
            ->setMetadata(json_encode(['is_host' => $isHost]));

        $videoGrant = (new VideoGrant())
            ->setRoomJoin(true)
            ->setRoomName($roomName)
            ->setCanUpdateOwnMetadata(true)
            ->setCanPublishData(true);
        
        if ($isHost) {
            $videoGrant->setRoomAdmin(true);
        }

        $token = (new AccessToken($apiKey, $apiSecret))
            ->init($tokenOptions)
            ->setGrant($videoGrant)
            ->toJwt();

        return response()->json(['token' => $token]);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:51200', // 50MB
            'room_id' => 'required|string',
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('uploads/' . $request->room_id, $fileName, 'public');

            Attachment::create([
                'room_id' => $request->room_id,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_size' => $file->getSize(),
            ]);

            return response()->json([
                'success' => true,
                'url' => asset('storage/' . $path),
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'type' => $file->getMimeType(),
            ]);
        }

        return response()->json(['error' => 'No file uploaded'], 400);
    }

    public function storeSummary(Request $request)
    {
        $request->validate([
            'room_id' => 'required|string',
            'summary' => 'required|string',
            'started_at' => 'nullable|date',
            'finished_at' => 'nullable|date',
        ]);

        $meeting = Meeting::create([
            'room_id' => $request->room_id,
            'meeting_summary' => $request->summary,
            'started_at' => $request->started_at ?? now(),
            'finished_at' => $request->finished_at ?? now(),
        ]);

        return response()->json([
            'success' => true,
            'meeting_id' => $meeting->id
        ]);
    }

    public function cleanupRoom(Request $request)
    {
        $request->validate(['room_id' => 'required|string']);

        $attachments = Attachment::where('room_id', $request->room_id)->get();

        /** @var Attachment $attachment */
        foreach ($attachments as $attachment) {
            Storage::disk('public')->delete($attachment->file_path);
            $attachment->delete();
        }

        // Also delete the room folder if empty
        Storage::disk('public')->deleteDirectory('uploads/' . $request->room_id);

        return response()->json(['success' => true, 'message' => 'Room files cleaned up']);
    }

    public function schedule(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'scheduled_at' => 'required|date',
        ]);

        $meeting = Meeting::create([
            'room_id' => Str::random(10),
            'title' => $request->title,
            'scheduled_at' => $request->scheduled_at,
            'is_scheduled' => true,
        ]);

        return response()->json([
            'success' => true,
            'meeting' => $meeting
        ]);
    }

    public function listMeetings()
    {
        return response()->json(Meeting::latest()->get());
    }

    public function handleHostAction(Request $request)
    {
        $request->validate([
            'room' => 'required|string',
            'identity' => 'required|string',
            'action' => 'required|string',
            'trackSid' => 'nullable|string',
        ]);

        $room = $request->room;
        $identity = $request->identity;
        $action = $request->action;
        $trackSid = $request->trackSid;

        $host = env('LIVEKIT_URL');
        $apiKey = env('LIVEKIT_API_KEY');
        $apiSecret = env('LIVEKIT_API_SECRET');

        $roomService = new RoomServiceClient($host, $apiKey, $apiSecret);

        try {
            switch ($action) {
                case 'mute':
                    if (!$trackSid) {
                        return response()->json(['error' => 'Missing trackSid for mute action'], 400);
                    }
                    $roomService->mutePublishedTrack($room, $identity, $trackSid, true);
                    break;
                case 'remove':
                    $roomService->removeParticipant($room, $identity);
                    break;
                default:
                    return response()->json(['error' => 'Invalid action'], 400);
            }
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Action failed: ' . $e->getMessage()], 500);
        }
    }
}
