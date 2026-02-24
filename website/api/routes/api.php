<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;


Route::prefix('/users')->group(function () {
    Route::post('/signup', [UserController::class, 'signup']);

    Route::get('/test', function () {
        return response()->json([
            'message' => 'Hello World!'
        ]);
    });
});

