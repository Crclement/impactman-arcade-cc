<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserImpact extends Model
{
    use HasFactory;

    protected $table = 'UserImpacts';

    protected $fillable = [
        'value'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function impactCampaign()
    {
        return $this->belongsTo(ImpactCampaign::class, 'impactCampaignId');
    }

    public function gameSession()
    {
        return $this->belongsTo(GameSession::class, 'gameSessionId');
    }

    public function partnerImpression()
    {
        return $this->belongsTo(PartnerImpression::class, 'partnerImpressionId');
    }
}
