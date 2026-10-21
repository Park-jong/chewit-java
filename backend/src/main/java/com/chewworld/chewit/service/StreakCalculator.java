package com.chewworld.chewit.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Set;

/**
 * 루틴 연속 달성 계산 (순수 함수).
 * 예정일(요일 집합에 해당하는 날)만 세고, 예정이 아닌 날은 연속을 끊지 않고 건너뛴다.
 */
public final class StreakCalculator {

    /** 조회 범위 상한 (asOf 기준 과거 일수). */
    static final int MAX_LOOKBACK_DAYS = 365;

    private StreakCalculator() {
    }

    public record Streak(int current, int longest) {
        public static final Streak NONE = new Streak(0, 0);
    }

    /** 조회 범위의 시작일: max(루틴 생성일, asOf - 365일). 생성일이 없으면 상한만 적용. */
    static LocalDate rangeStart(LocalDate createdDate, LocalDate asOf) {
        LocalDate limit = asOf.minusDays(MAX_LOOKBACK_DAYS);
        return createdDate != null && createdDate.isAfter(limit) ? createdDate : limit;
    }

    public static Streak compute(Set<DayOfWeek> daysOfWeek, Set<LocalDate> completedDates,
                                 LocalDate createdDate, LocalDate asOf) {
        LocalDate start = rangeStart(createdDate, asOf);
        if (daysOfWeek.isEmpty() || start.isAfter(asOf)) {
            return Streak.NONE;
        }

        // current: asOf에서 과거로. 아직 안 한 asOf는 연속을 끊지 않는다.
        int current = 0;
        for (LocalDate date = asOf; !date.isBefore(start); date = date.minusDays(1)) {
            if (!daysOfWeek.contains(date.getDayOfWeek())) {
                continue;
            }
            if (completedDates.contains(date)) {
                current++;
            } else if (!date.equals(asOf)) {
                break;
            }
        }

        // longest: 범위 안 최장 연속
        int longest = 0;
        int run = 0;
        for (LocalDate date = start; !date.isAfter(asOf); date = date.plusDays(1)) {
            if (!daysOfWeek.contains(date.getDayOfWeek())) {
                continue;
            }
            if (completedDates.contains(date)) {
                run++;
                longest = Math.max(longest, run);
            } else {
                run = 0;
            }
        }
        return new Streak(current, longest);
    }
}
