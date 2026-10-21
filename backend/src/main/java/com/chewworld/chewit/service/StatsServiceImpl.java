package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.StatsDtos.ChecklistStats;
import com.chewworld.chewit.dto.StatsDtos.DailyCount;
import com.chewworld.chewit.dto.StatsDtos.EventStats;
import com.chewworld.chewit.dto.StatsDtos.MonthlyStatsResponse;
import com.chewworld.chewit.dto.StatsDtos.RoutineStats;
import com.chewworld.chewit.dto.StatsDtos.RoutineStreak;
import com.chewworld.chewit.dto.StatsDtos.TaskStats;
import com.chewworld.chewit.entity.Checklist;
import com.chewworld.chewit.entity.ChecklistItem;
import com.chewworld.chewit.entity.Routine;
import com.chewworld.chewit.entity.RoutineCompletion;
import com.chewworld.chewit.entity.Task;
import com.chewworld.chewit.repository.ChecklistRepository;
import com.chewworld.chewit.repository.RoutineCompletionRepository;
import com.chewworld.chewit.repository.RoutineRepository;
import com.chewworld.chewit.repository.TaskRepository;
import com.chewworld.chewit.service.StreakCalculator.Streak;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    private final TaskRepository taskRepository;
    private final RoutineRepository routineRepository;
    private final RoutineCompletionRepository routineCompletionRepository;
    private final ChecklistRepository checklistRepository;
    private final EventService eventService;

    @Override
    @Transactional(readOnly = true)
    public MonthlyStatsResponse monthly(Long userId, YearMonth month) {
        LocalDate monthStart = month.atDay(1);
        LocalDate monthEnd = month.atEndOfMonth();

        return new MonthlyStatsResponse(
                month.toString(),
                taskStats(userId, monthStart, monthEnd),
                routineStats(userId, monthStart, monthEnd),
                checklistStats(userId),
                eventStats(userId, month),
                routineStreaks(userId, month)
        );
    }

    private TaskStats taskStats(Long userId, LocalDate monthStart, LocalDate monthEnd) {
        List<Task> tasks = taskRepository.findByUser_IdAndDateBetween(userId, monthStart, monthEnd);
        Map<LocalDate, List<Task>> byDate = tasks.stream().collect(Collectors.groupingBy(Task::getDate));

        List<DailyCount> daily = monthStart.datesUntil(monthEnd.plusDays(1))
                .map(date -> {
                    List<Task> dayTasks = byDate.getOrDefault(date, List.of());
                    int completed = (int) dayTasks.stream().filter(Task::isDone).count();
                    return new DailyCount(date, dayTasks.size(), completed);
                })
                .toList();

        int total = tasks.size();
        int completed = (int) tasks.stream().filter(Task::isDone).count();
        return new TaskStats(total, completed, completionRate(completed, total), daily);
    }

    private RoutineStats routineStats(Long userId, LocalDate monthStart, LocalDate monthEnd) {
        List<Routine> activeRoutines = routineRepository.findByUser_IdOrderByCreatedAtAsc(userId).stream()
                .filter(Routine::isActive)
                .toList();

        if (activeRoutines.isEmpty()) {
            List<DailyCount> daily = monthStart.datesUntil(monthEnd.plusDays(1))
                    .map(date -> new DailyCount(date, 0, 0))
                    .toList();
            return new RoutineStats(0, 0, 0.0, daily);
        }

        List<Long> routineIds = activeRoutines.stream().map(Routine::getId).toList();
        Map<LocalDate, Set<Long>> doneRoutineIdsByDate = routineCompletionRepository
                .findByRoutine_IdInAndDateBetween(routineIds, monthStart, monthEnd).stream()
                .collect(Collectors.groupingBy(RoutineCompletion::getDate,
                        Collectors.mapping(completion -> completion.getRoutine().getId(), Collectors.toSet())));

        List<DailyCount> daily = monthStart.datesUntil(monthEnd.plusDays(1))
                .map(date -> {
                    DayOfWeek dayOfWeek = date.getDayOfWeek();
                    Set<Long> doneRoutineIds = doneRoutineIdsByDate.getOrDefault(date, Set.of());
                    long expected = activeRoutines.stream()
                            .filter(routine -> routine.getDaysOfWeek().contains(dayOfWeek))
                            .count();
                    long completed = activeRoutines.stream()
                            .filter(routine -> routine.getDaysOfWeek().contains(dayOfWeek) && doneRoutineIds.contains(routine.getId()))
                            .count();
                    return new DailyCount(date, (int) expected, (int) completed);
                })
                .toList();

        int expectedTotal = daily.stream().mapToInt(DailyCount::total).sum();
        int completedTotal = daily.stream().mapToInt(DailyCount::completed).sum();
        return new RoutineStats(expectedTotal, completedTotal, completionRate(completedTotal, expectedTotal), daily);
    }

    private List<RoutineStreak> routineStreaks(Long userId, YearMonth month) {
        LocalDate today = LocalDate.now();
        if (month.atDay(1).isAfter(today)) {
            return List.of();
        }
        LocalDate monthEnd = month.atEndOfMonth();
        LocalDate asOf = monthEnd.isBefore(today) ? monthEnd : today;

        List<Routine> activeRoutines = routineRepository.findByUser_IdOrderByCreatedAtAsc(userId).stream()
                .filter(Routine::isActive)
                .toList();
        if (activeRoutines.isEmpty()) {
            return List.of();
        }

        List<Long> routineIds = activeRoutines.stream().map(Routine::getId).toList();
        LocalDate from = asOf.minusDays(StreakCalculator.MAX_LOOKBACK_DAYS);
        Map<Long, Set<LocalDate>> datesByRoutineId = routineCompletionRepository
                .findByRoutine_IdInAndDateBetween(routineIds, from, asOf).stream()
                .collect(Collectors.groupingBy(completion -> completion.getRoutine().getId(),
                        Collectors.mapping(RoutineCompletion::getDate, Collectors.toSet())));

        // 정렬은 안정 정렬이라 동률이면 생성 순서가 유지된다.
        return activeRoutines.stream()
                .map(routine -> {
                    LocalDate createdDate = routine.getCreatedAt() == null ? null
                            : LocalDate.ofInstant(routine.getCreatedAt(), ZoneId.systemDefault());
                    Streak streak = StreakCalculator.compute(routine.getDaysOfWeek(),
                            datesByRoutineId.getOrDefault(routine.getId(), Set.of()), createdDate, asOf);
                    return new RoutineStreak(routine.getId(), routine.getTitle(), streak.current(), streak.longest());
                })
                .filter(streak -> streak.currentStreak() > 0 || streak.longestStreak() > 0)
                .sorted(Comparator.comparingInt(RoutineStreak::currentStreak).reversed())
                .limit(5)
                .toList();
    }

    private ChecklistStats checklistStats(Long userId) {
        List<Checklist> checklists = checklistRepository.findByUser_IdOrderByCreatedAtAsc(userId);
        int totalItems = 0;
        int completedItems = 0;
        for (Checklist checklist : checklists) {
            totalItems += checklist.getItems().size();
            completedItems += (int) checklist.getItems().stream().filter(ChecklistItem::isChecked).count();
        }
        return new ChecklistStats(checklists.size(), totalItems, completedItems, completionRate(completedItems, totalItems));
    }

    private EventStats eventStats(Long userId, YearMonth month) {
        return new EventStats(eventService.listByMonth(userId, month).size());
    }

    private double completionRate(int completed, int total) {
        if (total == 0) {
            return 0.0;
        }
        return Math.round((double) completed / total * 10000) / 10000.0;
    }
}
