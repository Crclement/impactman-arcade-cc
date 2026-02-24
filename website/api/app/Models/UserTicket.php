<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserTicket extends Model
{
    use HasFactory;

    protected $table = 'UserTickets';

    protected $fillable = [
        'total',
        'created_at',
        'gameSessionId',
        'userId',
    ];

    public function gameSession()
    {
        return $this->belongsTo(GameSession::class, 'gameSessionId');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }
}
