<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerDeposit extends Model
{
    use HasFactory;

    protected $fillable = [
        'amount'
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partnerId');
    }
}
