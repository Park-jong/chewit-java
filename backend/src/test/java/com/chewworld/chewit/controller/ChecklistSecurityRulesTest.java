package com.chewworld.chewit.controller;

import com.chewworld.chewit.config.SecurityConfig;
import com.chewworld.chewit.repository.UserRepository;
import com.chewworld.chewit.security.JwtTokenProvider;
import com.chewworld.chewit.service.ChecklistService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 실제 SecurityConfig 필터 체인을 적용해 체크리스트 복제 API가 인증을 요구하는지 검증한다. */
@WebMvcTest(controllers = ChecklistController.class)
@Import(SecurityConfig.class)
class ChecklistSecurityRulesTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ChecklistService checklistService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void duplicate는_토큰이_없으면_401을_반환하고_서비스를_호출하지_않는다() throws Exception {
        mockMvc.perform(post("/api/checklists/{id}/duplicate", 1L))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(checklistService);
    }
}
