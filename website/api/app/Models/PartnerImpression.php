<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerImpression extends Model
{
    use HasFactory;

    protected $fillable = [
        'amount',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partnerId');
    }

    public function game()
    {
        return $this->belongsTo(Game::class, 'gameId');
    }

    public function gameSession()
    {
        return $this->belongsTo(GameSession::class, 'gameSessionId');
    }
}
