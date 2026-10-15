package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.AuthDtos.AuthResponse;
import com.chewworld.chewit.dto.AuthDtos.LoginRequest;
import com.chewworld.chewit.dto.AuthDtos.SignupRequest;
import com.chewworld.chewit.dto.AuthDtos.UserResponse;
import com.chewworld.chewit.exception.DuplicateEmailException;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static com.chewworld.chewit.controller.support.ControllerTestSupport.authenticatedAs;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest extends com.chewworld.chewit.controller.support.ControllerSliceTestBase {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private AuthService authService;

    @Test
    void signup_성공하면_토큰과_사용자정보를_반환한다() throws Exception {
        SignupRequest request = new SignupRequest("test@test.com", "password123", "닉네임");
        when(authService.signup(any())).thenReturn(
                new AuthResponse("token", new UserResponse(1L, "test@test.com", "닉네임")));

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token"))
                .andExpect(jsonPath("$.user.email").value("test@test.com"));
    }

    @Test
    void signup_이메일_형식이_아니면_400을_반환한다() throws Exception {
        SignupRequest request = new SignupRequest("invalid-email", "password123", "닉네임");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("email")));
    }

    @Test
    void signup_이메일이_중복이면_409를_반환한다() throws Exception {
        SignupRequest request = new SignupRequest("test@test.com", "password123", "닉네임");
        when(authService.signup(any())).thenThrow(new DuplicateEmailException("이미 가입된 이메일입니다."));

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("이미 가입된 이메일입니다."));
    }

    @Test
    void login_성공하면_토큰을_반환한다() throws Exception {
        LoginRequest request = new LoginRequest("test@test.com", "password123");
        when(authService.login(any())).thenReturn(
                new AuthResponse("token", new UserResponse(1L, "test@test.com", "닉네임")));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token"));
    }

    @Test
    void login_실패하면_401을_반환한다() throws Exception {
        LoginRequest request = new LoginRequest("test@test.com", "wrong");
        when(authService.login(any()))
                .thenThrow(new BadCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다."));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("이메일 또는 비밀번호가 올바르지 않습니다."));
    }

    @Test
    void me_인증된_사용자_정보를_반환한다() throws Exception {
        when(authService.getCurrentUser(1L)).thenReturn(new UserResponse(1L, "test@test.com", "닉네임"));

        mockMvc.perform(get("/api/auth/me").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@test.com"));
    }

    @Test
    void me_사용자가_없으면_404를_반환한다() throws Exception {
        when(authService.getCurrentUser(1L)).thenThrow(new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        mockMvc.perform(get("/api/auth/me").with(authenticatedAs(1L)))
                .andExpect(status().isNotFound());
    }

    @Test
    void me_principal이_없으면_401을_반환한다() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("인증이 필요합니다."));

        verify(authService, never()).getCurrentUser(any());
    }
}
