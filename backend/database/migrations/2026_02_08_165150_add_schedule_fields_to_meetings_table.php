<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->string('title')->nullable()->after('room_id');
            $table->timestamp('scheduled_at')->nullable()->after('finished_at');
            $table->boolean('is_scheduled')->default(false)->after('scheduled_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->dropColumn(['title', 'scheduled_at', 'is_scheduled']);
        });
    }
};
