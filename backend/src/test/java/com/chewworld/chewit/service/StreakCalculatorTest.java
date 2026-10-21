package com.chewworld.chewit.service;

import com.chewworld.chewit.service.StreakCalculator.Streak;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class StreakCalculatorTest {

    private static final LocalDate OLD = LocalDate.of(2020, 1, 1);
    private static final LocalDate WED = LocalDate.of(2026, 10, 21); // 수요일
    private static final Set<DayOfWeek> EVERY_DAY = Set.of(DayOfWeek.values());

    private static Set<LocalDate> days(LocalDate from, int count) {
        Set<LocalDate> dates = new HashSet<>();
        for (int i = 0; i < count; i++) {
            dates.add(from.plusDays(i));
        }
        return dates;
    }

    @Test
    void 완료_기록이_없으면_둘_다_0이다() {
        Streak streak = StreakCalculator.compute(EVERY_DAY, Set.of(), OLD, WED);

        assertThat(streak).isEqualTo(new Streak(0, 0));
    }

    @Test
    void 요일_집합이_비어_있으면_둘_다_0이다() {
        Streak streak = StreakCalculator.compute(Set.of(), days(WED.minusDays(3), 4), OLD, WED);

        assertThat(streak).isEqualTo(new Streak(0, 0));
    }

    @Test
    void 오늘은_미완료여도_어제까지_연속이면_끊기지_않는다() {
        Streak streak = StreakCalculator.compute(EVERY_DAY, days(WED.minusDays(3), 3), OLD, WED);

        assertThat(streak).isEqualTo(new Streak(3, 3));
    }

    @Test
    void 오늘_완료를_포함해_연속을_센다() {
        Streak streak = StreakCalculator.compute(EVERY_DAY, days(WED.minusDays(3), 4), OLD, WED);

        assertThat(streak).isEqualTo(new Streak(4, 4));
    }

    @Test
    void 어제가_미완료이면_오늘_완료해도_연속은_1이다() {
        Set<LocalDate> done = days(WED.minusDays(5), 3); // 5~3일 전
        done.add(WED);

        Streak streak = StreakCalculator.compute(EVERY_DAY, done, OLD, WED);

        assertThat(streak.current()).isEqualTo(1);
        assertThat(streak.longest()).isEqualTo(3);
    }

    @Test
    void 어제도_오늘도_미완료이면_현재_연속은_0이고_과거_최장은_유지된다() {
        Streak streak = StreakCalculator.compute(EVERY_DAY, days(WED.minusDays(6), 3), OLD, WED);

        assertThat(streak).isEqualTo(new Streak(0, 3));
    }

    @Test
    void 예정이_아닌_요일은_건너뛰고_연속을_끊지_않는다() {
        // 월·수·금 루틴. 수(10/21) 완료, 월(10/19) 완료, 금(10/16) 완료, 토·일은 예정 아님
        Set<DayOfWeek> mwf = Set.of(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY);
        Set<LocalDate> done = Set.of(LocalDate.of(2026, 10, 21), LocalDate.of(2026, 10, 19), LocalDate.of(2026, 10, 16));

        Streak streak = StreakCalculator.compute(mwf, done, OLD, WED);

        assertThat(streak).isEqualTo(new Streak(3, 3));
    }

    @Test
    void asOf가_예정일이_아니면_직전_예정일부터_센다() {
        // 월·수 루틴, asOf = 목요일(10/22). 수(21)·월(19) 완료
        Set<DayOfWeek> mw = Set.of(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY);
        Set<LocalDate> done = Set.of(LocalDate.of(2026, 10, 21), LocalDate.of(2026, 10, 19));

        Streak streak = StreakCalculator.compute(mw, done, OLD, LocalDate.of(2026, 10, 22));

        assertThat(streak).isEqualTo(new Streak(2, 2));
    }

    @Test
    void asOf가_예정일이_아니고_직전_예정일이_미완료이면_0이다() {
        Set<DayOfWeek> mw = Set.of(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY);
        Set<LocalDate> done = Set.of(LocalDate.of(2026, 10, 19));

        Streak streak = StreakCalculator.compute(mw, done, OLD, LocalDate.of(2026, 10, 22));

        assertThat(streak).isEqualTo(new Streak(0, 1));
    }

    @Test
    void 중간에_하루_빠지면_현재_연속은_거기서_끊긴다() {
        Set<LocalDate> done = days(WED.minusDays(6), 7); // 6일 전 ~ 오늘
        done.remove(WED.minusDays(2));

        Streak streak = StreakCalculator.compute(EVERY_DAY, done, OLD, WED);

        assertThat(streak.current()).isEqualTo(2); // 어제, 오늘
        assertThat(streak.longest()).isEqualTo(4); // 6~3일 전
    }

    @Test
    void 루틴_생성일_이전은_예정일로_치지_않는다() {
        // 이틀 전에 생성. 그 전 날짜의 완료 기록이 있어도 범위 밖이라 무시한다.
        LocalDate created = WED.minusDays(2);
        Set<LocalDate> done = days(WED.minusDays(10), 13); // 생성 전부터 오늘까지 모두 기록

        Streak streak = StreakCalculator.compute(EVERY_DAY, done, created, WED);

        assertThat(streak).isEqualTo(new Streak(3, 3));
    }

    @Test
    void 생성일이_asOf_이후이면_0이다() {
        Streak streak = StreakCalculator.compute(EVERY_DAY, days(WED.minusDays(3), 4), WED.plusDays(1), WED);

        assertThat(streak).isEqualTo(new Streak(0, 0));
    }

    @Test
    void 조회_범위는_asOf_기준_365일로_제한된다() {
        // 400일 연속 완료해도 asOf-365일 ~ asOf = 366일치만 센다
        Set<LocalDate> done = days(WED.minusDays(399), 400);

        Streak streak = StreakCalculator.compute(EVERY_DAY, done, OLD, WED);

        assertThat(streak).isEqualTo(new Streak(366, 366));
    }

    @Test
    void 범위_시작일은_생성일과_365일_전_중_늦은_날이다() {
        assertThat(StreakCalculator.rangeStart(OLD, WED)).isEqualTo(WED.minusDays(365));
        assertThat(StreakCalculator.rangeStart(WED.minusDays(10), WED)).isEqualTo(WED.minusDays(10));
        assertThat(StreakCalculator.rangeStart(null, WED)).isEqualTo(WED.minusDays(365));
    }

    @Test
    void 최장_연속이_과거_구간에_있고_현재_연속보다_길다() {
        Set<LocalDate> done = days(WED.minusDays(30), 10); // 30~21일 전: 10일
        done.addAll(days(WED.minusDays(2), 2)); // 2일 전, 어제

        Streak streak = StreakCalculator.compute(EVERY_DAY, done, OLD, WED);

        assertThat(streak).isEqualTo(new Streak(2, 10));
    }

    @Test
    void asOf_이후의_완료_기록은_무시한다() {
        Set<LocalDate> done = days(WED.minusDays(1), 6); // 어제 ~ 4일 뒤

        Streak streak = StreakCalculator.compute(EVERY_DAY, done, OLD, WED);

        assertThat(streak).isEqualTo(new Streak(2, 2));
    }

    @Test
    void 월_경계를_넘어_연속을_센다() {
        LocalDate asOf = LocalDate.of(2026, 11, 2);
        Set<LocalDate> done = days(LocalDate.of(2026, 10, 30), 4); // 10/30 ~ 11/2

        Streak streak = StreakCalculator.compute(EVERY_DAY, done, OLD, asOf);

        assertThat(streak).isEqualTo(new Streak(4, 4));
    }

    @Test
    void 연_경계를_넘어_연속을_센다() {
        LocalDate asOf = LocalDate.of(2027, 1, 2);
        Set<LocalDate> done = days(LocalDate.of(2026, 12, 30), 4); // 12/30 ~ 1/2

        Streak streak = StreakCalculator.compute(EVERY_DAY, done, OLD, asOf);

        assertThat(streak).isEqualTo(new Streak(4, 4));
    }
}
