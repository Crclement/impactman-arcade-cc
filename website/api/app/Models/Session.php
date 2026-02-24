<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Session extends Model
{
    use HasFactory;

    protected $table = 'Sessions';

    protected $fillable = [
        'token',
        'expiryAt',
        'renew',
        'userId'
    ];

    protected $casts = [
        'expiryAt' => 'datetime',
        'renew' => 'boolean'
    ];

    public static function boot() {
        parent::boot();

        static::creating(function ($session) {
            $session->token = (string) Str::uuid();
            $session->expiryAt = now()->addDays(7);
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }

    public function refreshToken(){
        $this->expiryAt = now()->addDays(7);
        $this->token = (string) Str::uuid();
        $this->save();

        return $this;
    }
}
