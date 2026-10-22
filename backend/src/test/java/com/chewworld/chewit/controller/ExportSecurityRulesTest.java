package com.chewworld.chewit.controller;

import com.chewworld.chewit.config.SecurityConfig;
import com.chewworld.chewit.repository.UserRepository;
import com.chewworld.chewit.security.JwtTokenProvider;
import com.chewworld.chewit.service.ExportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 실제 SecurityConfig 필터 체인을 적용해 내보내기 API가 인증을 요구하는지 검증한다. */
@WebMvcTest(controllers = ExportController.class)
@Import(SecurityConfig.class)
class ExportSecurityRulesTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ExportService exportService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void export는_토큰이_없으면_401을_반환하고_서비스를_호출하지_않는다() throws Exception {
        mockMvc.perform(get("/api/export").param("format", "csv"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(exportService);
    }
}
