package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.ExportDtos.ExportCategory;
import com.chewworld.chewit.dto.ExportDtos.ExportDocument;
import com.chewworld.chewit.service.ExportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static com.chewworld.chewit.controller.support.ControllerTestSupport.authenticatedAs;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ExportController.class)
@AutoConfigureMockMvc(addFilters = false)
class ExportControllerTest extends com.chewworld.chewit.controller.support.ControllerSliceTestBase {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ExportService exportService;

    private ExportDocument sampleDocument() {
        return new ExportDocument(1, Instant.parse("2026-10-22T00:00:00Z"),
                List.of(new ExportCategory(5L, "업무", "#3B82F6", Instant.parse("2026-10-01T00:00:00Z"))),
                List.of(), List.of(), List.of(), List.of());
    }

    @Test
    void export_기본값은_json이고_파일명_헤더가_붙는다() throws Exception {
        when(exportService.exportData(1L)).thenReturn(sampleDocument());

        mockMvc.perform(get("/api/export").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"chewit-export-" + LocalDate.now() + ".json\""))
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.categories[0].name").value("업무"))
                .andExpect(jsonPath("$.tasks").isEmpty());
    }

    @Test
    void export_csv는_UTF8_본문과_csv_파일명을_반환한다() throws Exception {
        when(exportService.exportCsv(1L)).thenReturn("﻿kind,id\r\n");

        byte[] body = mockMvc.perform(get("/api/export").param("format", "CSV").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"chewit-export-" + LocalDate.now() + ".csv\""))
                .andExpect(header().string("Content-Type", "text/csv;charset=UTF-8"))
                .andReturn().getResponse().getContentAsByteArray();

        org.assertj.core.api.Assertions.assertThat(body).startsWith(0xEF, 0xBB, 0xBF);
        org.assertj.core.api.Assertions.assertThat(new String(body, StandardCharsets.UTF_8))
                .isEqualTo("﻿kind,id\r\n");
    }

    @Test
    void export_잘못된_format은_400이고_서비스를_호출하지_않는다() throws Exception {
        mockMvc.perform(get("/api/export").param("format", "xml").with(authenticatedAs(1L)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("format은 json 또는 csv여야 합니다."));

        verify(exportService, never()).exportData(1L);
        verify(exportService, never()).exportCsv(1L);
    }

    @Test
    void export_빈_값이나_공백_format은_400이고_서비스를_호출하지_않는다() throws Exception {
        for (String blank : new String[]{"", "   "}) {
            mockMvc.perform(get("/api/export").param("format", blank).with(authenticatedAs(1L)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("format은 json 또는 csv여야 합니다."));
        }

        verify(exportService, never()).exportData(1L);
        verify(exportService, never()).exportCsv(1L);
    }
}
