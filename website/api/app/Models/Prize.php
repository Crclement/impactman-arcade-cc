<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prize extends Model
{
    use HasFactory;

    protected $fillable = [
        'cover',
        'name',
        'price',
        'totalAvailable'
    ];

    // Users relation through pivot table 'UserPrizes'
    public function users()
    {
        return $this->belongsToMany(User::class, 'UserPrizes', 'prizeId', 'userId')
            ->withPivot(['id', 'createdAt', 'updatedAt', 'deletedAt'])
            ->withTimestamps()
            ->using(UserPrize::class);
    }
}
