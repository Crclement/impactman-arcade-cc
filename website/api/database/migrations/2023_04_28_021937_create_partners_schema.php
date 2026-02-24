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
        //Partner	id	userId name
        Schema::create('Partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamp('createdAt')->useCurrent();

            $table->foreignId('userId')->constrained('Users')->onDelete('cascade');
        });

        //PartnerImpression	id	partnerId	gameId	createdAt	amount	gameSessionId
        Schema::create('PartnerImpressions', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('amount');
            $table->timestamp('createdAt')->useCurrent();

            $table->foreignId('partnerId')->constrained('Partners')->onDelete('cascade');
            $table->foreignId('gameId')->constrained('Games')->onDelete('cascade');
            $table->foreignId('gameSessionId')->constrained('GameSessions')->onDelete('cascade');
        });

        //PartnerDeposits	id	partnerId	amount
        Schema::create('PartnerDeposits', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('amount');
            $table->timestamp('createdAt')->useCurrent();

            $table->foreignId('partnerId')->constrained('Partners')->onDelete('cascade');
        });

        Schema::table('UserImpacts', function (Blueprint $table) {
            $table->foreignId('partnerImpressionId')->nullable()->constrained('PartnerImpressions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('UserImpacts', function (Blueprint $table) {
            $table->dropForeign(['partnerImpressionId']);
        });

        Schema::dropIfExists('PartnerDeposits');
        Schema::dropIfExists('PartnerImpressions');
        Schema::dropIfExists('Partners');
    }
};
