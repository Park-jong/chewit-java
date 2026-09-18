package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.CalendarDtos.CalendarMonthResponse;

import java.time.YearMonth;

public interface CalendarService {

    CalendarMonthResponse getMonth(Long userId, YearMonth month);
}
