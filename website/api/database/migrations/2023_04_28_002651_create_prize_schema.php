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
        //Prize	id	cover	price	totalAvailable	createdAt	updatedAt
        Schema::create('Prizes', function (Blueprint $table) {
            $table->id();
            $table->string('cover');
            $table->string('name');
            $table->unsignedInteger('price');
            $table->unsignedInteger('totalAvailable');
            
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent();
        });

        //UserPrizes userId	prizeId	createdAt
        Schema::create('UserPrizes', function (Blueprint $table) {
            $table->id();
            $table->timestamp('createdAt')->useCurrent();

            $table->foreignId('prizeId')->constrained('Prizes')->onDelete('cascade');
            $table->foreignId('userId')->constrained("Users")->onDelete('cascade');
        });

        //ImpactCampaigns	id	slug	name    createdAt	updatedAt
        Schema::create('ImpactCampaigns', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent();
        });

        //UserImpacts	id	userId	impactCampaignId	gameSessionId	value   partnerImpressionId
        Schema::create('UserImpacts', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('value');
            $table->timestamp('createdAt')->useCurrent();
            
            $table->foreignId('impactCampaignId')->constrained('ImpactCampaigns')->onDelete('cascade');
            $table->foreignId('userId')->constrained("Users")->onDelete('cascade');
            $table->foreignId('gameSessionId')->constrained("GameSessions")->onDelete('cascade');
        });

        Schema::create('UserTickets', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('total');
            $table->timestamp('createdAt')->useCurrent();

            $table->foreignId('gameSessionId')->constrained("GameSessions")->onDelete('cascade');
            $table->foreignId('userId')->constrained("Users")->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('UserTickets');
        Schema::dropIfExists('UserImpacts');
        Schema::dropIfExists('ImpactCampaigns');
        Schema::dropIfExists('UserPrizes');
        Schema::dropIfExists('Prizes');
    }
};
