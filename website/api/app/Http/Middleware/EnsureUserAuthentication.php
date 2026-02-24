<?php

namespace App\Http\Middleware;

use App\Models\Session;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;


class EnsureUserAuthentication
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $session = Session::where('id', $token)->join('Users', 'Users.id', '=', 'Sessions.userId')->first();

        // Check if session is expired
        if (!$session || $session->expiryAt > now()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $request->attributes->add(['session' => $session]);

        return $next($request);
    }
}
