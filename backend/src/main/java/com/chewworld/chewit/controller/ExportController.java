package com.chewworld.chewit.controller;

import com.chewworld.chewit.exception.InvalidRequestException;
import com.chewworld.chewit.security.UserPrincipal;
import com.chewworld.chewit.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Locale;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private static final MediaType CSV_UTF8 = new MediaType("text", "csv", StandardCharsets.UTF_8);

    private final ExportService exportService;

    @GetMapping
    public ResponseEntity<?> export(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String format
    ) {
        // 파라미터가 아예 없을 때만 json 기본값. 빈 문자열·공백은 잘못된 값으로 400 처리한다.
        String normalized = format == null ? "json" : format.trim().toLowerCase(Locale.ROOT);
        String fileDate = LocalDate.now().toString();

        return switch (normalized) {
            case "json" -> ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, attachment("chewit-export-" + fileDate + ".json"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(exportService.exportData(principal.userId()));
            case "csv" -> ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, attachment("chewit-export-" + fileDate + ".csv"))
                    .contentType(CSV_UTF8)
                    .body(exportService.exportCsv(principal.userId()).getBytes(StandardCharsets.UTF_8));
            default -> throw new InvalidRequestException("format은 json 또는 csv여야 합니다.");
        };
    }

    private static String attachment(String filename) {
        return ContentDisposition.attachment().filename(filename).build().toString();
    }
}
