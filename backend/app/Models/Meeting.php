<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
    protected $fillable = [
        'room_id',
        'title',
        'started_at',
        'finished_at',
        'scheduled_at',
        'is_scheduled',
        'meeting_summary'
    ];
}
