<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    use HasFactory;
    
    protected $table = 'users';

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    public function prizes(){
        return $this->belongsToMany(Prize::class, 'UserPrizes')
            ->using(UserPrize::class);
    }

    public function gameCollectables(){
        return $this->belongsToMany(GameCollectable::class, 'UserGameCollectables')
            ->using(UserGameCollectable::class);
    }
}
