package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.AuthDtos.AuthResponse;
import com.chewworld.chewit.dto.AuthDtos.LoginRequest;
import com.chewworld.chewit.dto.AuthDtos.SignupRequest;
import com.chewworld.chewit.dto.AuthDtos.UserResponse;
import com.chewworld.chewit.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/api/auth")
public interface AuthController {

    @PostMapping("/signup")
    AuthResponse signup(@Valid @RequestBody SignupRequest request);

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request);

    @GetMapping("/me")
    UserResponse me(@AuthenticationPrincipal UserPrincipal principal);
}
