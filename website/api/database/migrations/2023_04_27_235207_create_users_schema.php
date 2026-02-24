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
        Schema::create('Users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('name');
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('Sessions', function (Blueprint $table) {
            // uuid ID
            $table->id();
            $table->uuid('token')->unique();

            $table->timestamp('expiryAt');
            $table->boolean('renew')->default(false);

            $table->timestamp('createdAt')->useCurrent();

            $table->foreignId('userId')->constrained('Users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Sessions');
        Schema::dropIfExists('Users');
    }
};