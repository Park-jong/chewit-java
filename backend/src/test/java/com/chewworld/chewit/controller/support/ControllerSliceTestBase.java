package com.chewworld.chewit.controller.support;

import com.chewworld.chewit.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.AfterEach;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/**
 * JwtAuthenticationFilter는 Filter 타입이라 @WebMvcTest 슬라이스에 기본 포함되는데,
 * 실제 빈을 생성하면 JwtTokenProvider/UserRepository까지 필요해져 컨텍스트 로딩이 실패한다.
 * addFilters=false로 필터 자체는 실행하지 않으므로 빈만 mock으로 채워 컨텍스트를 띄운다.
 */
public abstract class ControllerSliceTestBase {

    @MockitoBean
    protected JwtAuthenticationFilter jwtAuthenticationFilter;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }
}
