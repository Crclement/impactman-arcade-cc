<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GameSession extends Model
{
    use HasFactory;

    protected $table = 'GameSessions';
    const CREATED_AT = 'createdAt';

    protected $fillable = [
        'score',
        'metadata',
        'userId',
        'gameId',
        'status',
        'createdAt',
        'endedAt'
    ];

    protected $casts = [
        'metadata' => 'array',
        'createdAt' => 'datetime',
        'endedAt' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }

    public function game()
    {
        return $this->belongsTo(Game::class, 'gameId');
    }
}
