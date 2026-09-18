package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.CalendarDtos.CalendarMonthResponse;
import com.chewworld.chewit.security.UserPrincipal;
import com.chewworld.chewit.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;

    @GetMapping
    public CalendarMonthResponse getMonth(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month
    ) {
        YearMonth targetMonth = month != null ? YearMonth.parse(month) : YearMonth.now();
        return calendarService.getMonth(principal.userId(), targetMonth);
    }
}
