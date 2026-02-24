<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\GameSession;

class GameController extends Controller
{
    /*
    *
    *   Create a new game session
    *
    *   @param Request $request
    *   @return \Illuminate\Http\JsonResponse
    */
    public function startSession(Request $request)
    {
        $request->validate([
            'gameId' => 'required|integer'
        ]);

        $gameSession = GameSession::create([
            'gameId' => $request->gameId,
            'userId' => $request->user()->id
        ]);

        return response()->json([
            'gameSession' => $gameSession
        ], 201);
    }

    /*
    *
    *   Update the score of a game session
    *
    *   @param Request $request
    *   @return \Illuminate\Http\JsonResponse
    */
    public function updateScore(Request $request){
        $request->validate([
            'gameSessionId' => 'required|integer',
            'score' => 'required|integer'
        ]);
        $gameSession = GameSession::find($request->gameSessionId);

        // Check if status is not ended
        if($gameSession->status == 'ended'){
            return response()->json([
                'message' => 'Game session has already ended'
            ], 400);
        }

        $gameSession->score = $request->score;
        $gameSession->save();

        return response()->json([], 200);
    }

    /*
    *
    *   End game session
    *
    *   @param Request $request
    *   @return \Illuminate\Http\JsonResponse
    */
    public function endSession(Request $request){
        $request->validate([
            'gameSessionId' => 'required|integer'
        ]);

        $gameSession = GameSession::find($request->gameSessionId);
        $gameSession->endedAt = now();
        $gameSession->status = 'ended';
        $gameSession->save();

        return response()->json([], 200);
    }
}
