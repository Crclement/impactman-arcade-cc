<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GameCollectable extends Model
{
    use HasFactory;

    protected $table = 'GameCollectables';

    protected $fillable = [
        'image',
        'name',
        'gameId'
    ];

    public function game()
    {
        return $this->belongsTo(Game::class, 'gameId');
    }
}
