<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    protected $fillable = [
        'room_id',
        'file_name',
        'file_path',
        'file_size'
    ];
}
