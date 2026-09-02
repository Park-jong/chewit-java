package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.StatsDtos.MonthlyStatsResponse;
import com.chewworld.chewit.security.UserPrincipal;
import com.chewworld.chewit.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/monthly")
    public MonthlyStatsResponse monthly(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month
    ) {
        YearMonth targetMonth = month != null ? YearMonth.parse(month) : YearMonth.now();
        return statsService.monthly(principal.userId(), targetMonth);
    }
}
