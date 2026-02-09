<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\MeetingController;

Route::get('/get-token', [MeetingController::class, 'getToken']);
Route::post('/upload', [MeetingController::class, 'upload']);
Route::post('/summary', [MeetingController::class, 'storeSummary']);
Route::post('/schedule', [MeetingController::class, 'schedule']);
Route::post('/cleanup', [MeetingController::class, 'cleanupRoom']);
Route::get('/meetings', [MeetingController::class, 'listMeetings']);
Route::post('/host-action', [MeetingController::class, 'handleHostAction']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
