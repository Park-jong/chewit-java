package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.StatsDtos.MonthlyStatsResponse;

import java.time.YearMonth;

public interface StatsService {

    MonthlyStatsResponse monthly(Long userId, YearMonth month);
}
