package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.AuthDtos.AuthResponse;
import com.chewworld.chewit.dto.AuthDtos.LoginRequest;
import com.chewworld.chewit.dto.AuthDtos.SignupRequest;
import com.chewworld.chewit.dto.AuthDtos.UserResponse;

public interface AuthService {

    AuthResponse signup(SignupRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(Long userId);
}
