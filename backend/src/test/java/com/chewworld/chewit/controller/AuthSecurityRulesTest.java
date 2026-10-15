package com.chewworld.chewit.controller;

import com.chewworld.chewit.config.SecurityConfig;
import com.chewworld.chewit.dto.AuthDtos.AuthResponse;
import com.chewworld.chewit.dto.AuthDtos.UserResponse;
import com.chewworld.chewit.entity.User;
import com.chewworld.chewit.repository.UserRepository;
import com.chewworld.chewit.security.JwtTokenProvider;
import com.chewworld.chewit.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 실제 SecurityConfig 필터 체인(실제 JwtAuthenticationFilter 포함)을 적용해 인가 규칙을 검증한다. */
@WebMvcTest(controllers = AuthController.class)
@Import(SecurityConfig.class)
class AuthSecurityRulesTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void me는_토큰이_없으면_필터체인에서_401을_반환한다() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("인증이 필요합니다."))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void me는_유효한_토큰이면_200과_사용자_정보를_반환한다() throws Exception {
        when(jwtTokenProvider.isValid("valid-token")).thenReturn(true);
        when(jwtTokenProvider.getUserId("valid-token")).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(
                User.builder().id(1L).email("test@test.com").displayName("닉네임").build()));
        when(authService.getCurrentUser(1L)).thenReturn(new UserResponse(1L, "test@test.com", "닉네임"));

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("test@test.com"))
                .andExpect(jsonPath("$.displayName").value("닉네임"));
    }

    @Test
    void login은_인증없이_접근할_수_있다() throws Exception {
        when(authService.login(any())).thenReturn(
                new AuthResponse("token", new UserResponse(1L, "test@test.com", "닉네임")));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@test.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void signup은_인증없이_접근할_수_있다() throws Exception {
        when(authService.signup(any())).thenReturn(
                new AuthResponse("token", new UserResponse(1L, "test@test.com", "닉네임")));

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@test.com\",\"password\":\"password123\",\"displayName\":\"닉네임\"}"))
                .andExpect(status().isOk());
    }
}
