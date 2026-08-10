package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.AuthDtos.AuthResponse;
import com.chewworld.chewit.dto.AuthDtos.LoginRequest;
import com.chewworld.chewit.dto.AuthDtos.SignupRequest;
import com.chewworld.chewit.dto.AuthDtos.UserResponse;
import com.chewworld.chewit.security.UserPrincipal;
import com.chewworld.chewit.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return authService.getCurrentUser(principal.userId());
    }
}
