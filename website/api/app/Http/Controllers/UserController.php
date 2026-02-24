<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Session;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function signup(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|string|unique:users',
            'password' => 'required|string|confirmed'
        ]);

        // Create user in database
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password)
        ]);

        // Create session for user
        $session = $this->createOrRefreshUserSession($user);

        return response()->json([
            'session' => $session,
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string'
        ]);

        // Find user in database
        $user = User::where('email', $request->email)->first();

        // Check if user exists
        if (!$user) {
            return response()->json([
                'message' => 'User not found!'
            ], 404);
        }

        // Check if password is correct
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Incorrect password!'
            ], 401);
        }

        // Create session for user
        $session = $this->createOrRefreshUserSession($user);

        return response()->json([
            'session' => $session,
            'user' => $user
        ], 200);
    }

    /**
     *
     * Creates or refreshes a session for a user
     *
     * @param   User  $user The object to convert
     * @return  Session
     *
     */
    private function createOrRefreshUserSession($user)
    {
        $session = Session::where('userId', $user->id)->first();

        if ($session) {
            $session = $session->refreshToken();
        } else {
            $session = Session::create([
                'userId' => $user->id
            ]);
        }
        return $session;
    }
}