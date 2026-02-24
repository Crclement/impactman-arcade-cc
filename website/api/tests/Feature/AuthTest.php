<?php

namespace Tests\Feature;

use Tests\TestCase;

class AuthTest extends TestCase
{
    /**
     * Test for signup
     */
    public function CanCreateAnAccount(): void
    {
        $response = $this->post('/signup', 
        ['name' => 'Sally']
        );
    }

    /**
     * Test for login
     */
    public function CanLogIn(): void
    {
        
    }
    
    /**
     * Test for token authorization
     */
    public function CanUseTokenToAuthorize(): void
    {
        
    }
}
