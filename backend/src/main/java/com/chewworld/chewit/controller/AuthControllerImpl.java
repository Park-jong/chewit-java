package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.AuthDtos.AuthResponse;
import com.chewworld.chewit.dto.AuthDtos.LoginRequest;
import com.chewworld.chewit.dto.AuthDtos.SignupRequest;
import com.chewworld.chewit.dto.AuthDtos.UserResponse;
import com.chewworld.chewit.security.UserPrincipal;
import com.chewworld.chewit.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AuthControllerImpl implements AuthController {

    private final AuthService authService;

    @Override
    public AuthResponse signup(SignupRequest request) {
        return authService.signup(request);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        return authService.login(request);
    }

    @Override
    public UserResponse me(UserPrincipal principal) {
        return authService.getCurrentUser(principal.userId());
    }
}
