<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImpactCampaign extends Model
{
    use HasFactory;

    protected $table = 'ImpactCampaigns';

    protected $fillable = [
        'slug',
        'name'
    ];
}
