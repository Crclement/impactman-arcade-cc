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
        Schema::create('Games', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent();
        });

        Schema::create('GameSessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('score');
            $table->json('metadata')->nullable();
            $table->enum('status', ['started', 'ended'])->default('started');
            $table->timestamp('createdAt')->useCurrent();
            $table->dateTime('endedAt')->nullable();

            $table->foreignId('userId')->constrained('Users')->onDelete('cascade');
            $table->foreignId('gameId')->constrained('Games')->onDelete('cascade');
        });

        Schema::create('GameCollectables', function (Blueprint $table) {
            $table->id();
            $table->string('image');
            $table->string('name');
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent();

            $table->foreignId('gameId')->constrained('Games')->onDelete('cascade');
        });

        Schema::create('UserGameCollectables', function (Blueprint $table) {
            $table->id();
            $table->timestamp('createdAt')->useCurrent();

            $table->foreignId('gameCollectableId')->constrained('GameCollectables')->onDelete('cascade');
            $table->foreignId('userId')->constrained("Users")->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('UserGameCollectables');
        Schema::dropIfExists('GameCollectables');
        Schema::dropIfExists('GameSessions');
        Schema::dropIfExists('Games');
    }
};
