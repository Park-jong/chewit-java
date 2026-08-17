package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.AuthDtos.AuthResponse;
import com.chewworld.chewit.dto.AuthDtos.LoginRequest;
import com.chewworld.chewit.dto.AuthDtos.SignupRequest;
import com.chewworld.chewit.dto.AuthDtos.UserResponse;
import com.chewworld.chewit.entity.User;
import com.chewworld.chewit.exception.DuplicateEmailException;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.repository.UserRepository;
import com.chewworld.chewit.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    void signup_저장하고_토큰을_발급한다() {
        SignupRequest request = new SignupRequest("test@example.com", "password123", "테스터");
        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("hashed");
        when(jwtTokenProvider.generateToken(any(), anyString())).thenReturn("token");

        AuthResponse response = authService.signup(request);

        assertThat(response.token()).isEqualTo("token");
        assertThat(response.user().email()).isEqualTo("test@example.com");
        assertThat(response.user().displayName()).isEqualTo("테스터");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void signup_이미_가입된_이메일이면_예외() {
        SignupRequest request = new SignupRequest("dup@example.com", "password123", "테스터");
        when(userRepository.existsByEmail(request.email())).thenReturn(true);

        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(DuplicateEmailException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_이메일과_비밀번호가_맞으면_토큰을_발급한다() {
        LoginRequest request = new LoginRequest("test@example.com", "password123");
        User user = User.builder().id(1L).email("test@example.com").passwordHash("hashed").displayName("테스터").build();
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(true);
        when(jwtTokenProvider.generateToken(user.getId(), user.getEmail())).thenReturn("token");

        AuthResponse response = authService.login(request);

        assertThat(response.token()).isEqualTo("token");
        assertThat(response.user().id()).isEqualTo(1L);
    }

    @Test
    void login_존재하지_않는_이메일이면_예외() {
        LoginRequest request = new LoginRequest("none@example.com", "password123");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_비밀번호가_틀리면_예외() {
        LoginRequest request = new LoginRequest("test@example.com", "wrong");
        User user = User.builder().id(1L).email("test@example.com").passwordHash("hashed").build();
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void getCurrentUser_존재하면_반환한다() {
        User user = User.builder().id(1L).email("test@example.com").displayName("테스터").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserResponse response = authService.getCurrentUser(1L);

        assertThat(response.email()).isEqualTo("test@example.com");
    }

    @Test
    void getCurrentUser_없으면_예외() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getCurrentUser(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
