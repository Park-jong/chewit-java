package com.chewworld.chewit.controller;

import com.chewworld.chewit.controller.support.ControllerSliceTestBase;
import com.chewworld.chewit.service.RoutineService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static com.chewworld.chewit.controller.support.ControllerTestSupport.authenticatedAs;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 프레임워크 4xx 예외가 GlobalExceptionHandler에서 500으로 바뀌지 않는지 검증한다. */
@WebMvcTest(controllers = RoutineController.class)
@AutoConfigureMockMvc(addFilters = false)
class FrameworkExceptionHandlingTest extends ControllerSliceTestBase {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RoutineService routineService;

    @Test
    void 없는_경로는_404를_반환한다() throws Exception {
        mockMvc.perform(get("/api/nope").with(authenticatedAs(1L)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("요청한 경로를 찾을 수 없습니다."))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void 메서드가_맞지_않으면_405를_반환한다() throws Exception {
        mockMvc.perform(get("/api/routines/1/toggle").with(authenticatedAs(1L)))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405))
                .andExpect(jsonPath("$.message").value("지원하지 않는 HTTP 메서드입니다."))
                .andExpect(header().string("Allow", org.hamcrest.Matchers.containsString("PATCH")));
    }

    @Test
    void 필수_파라미터가_없으면_400을_반환한다() throws Exception {
        mockMvc.perform(patch("/api/routines/1/toggle").with(authenticatedAs(1L)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("필수 파라미터가 누락되었습니다: date"));
    }

    @Test
    void 파라미터_타입이_맞지_않으면_400을_반환한다() throws Exception {
        mockMvc.perform(get("/api/routines/today").param("date", "not-a-date")
                        .with(authenticatedAs(1L)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("파라미터 형식이 올바르지 않습니다: date"));
    }

    @Test
    void 경로변수_타입이_맞지_않으면_400을_반환한다() throws Exception {
        mockMvc.perform(patch("/api/routines/abc/toggle").param("date", "2026-01-01")
                        .with(authenticatedAs(1L)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("파라미터 형식이 올바르지 않습니다: id"));
    }
}
