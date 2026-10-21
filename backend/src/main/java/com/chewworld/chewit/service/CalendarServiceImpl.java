package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.CalendarDtos.CalendarDayResponse;
import com.chewworld.chewit.dto.CalendarDtos.CalendarEventItem;
import com.chewworld.chewit.dto.CalendarDtos.CalendarMonthResponse;
import com.chewworld.chewit.dto.CalendarDtos.CalendarRoutineItem;
import com.chewworld.chewit.dto.CalendarDtos.CalendarTaskItem;
import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
import com.chewworld.chewit.dto.EventDtos.EventResponse;
import com.chewworld.chewit.entity.Routine;
import com.chewworld.chewit.entity.RoutineCompletion;
import com.chewworld.chewit.entity.Task;
import com.chewworld.chewit.repository.RoutineCompletionRepository;
import com.chewworld.chewit.repository.RoutineRepository;
import com.chewworld.chewit.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CalendarServiceImpl implements CalendarService {

    private final TaskRepository taskRepository;
    private final RoutineRepository routineRepository;
    private final RoutineCompletionRepository routineCompletionRepository;
    private final EventService eventService;

    @Override
    @Transactional(readOnly = true)
    public CalendarMonthResponse getMonth(Long userId, YearMonth month) {
        LocalDate monthStart = month.atDay(1);
        LocalDate monthEnd = month.atEndOfMonth();

        Map<LocalDate, List<Task>> tasksByDate = taskRepository
                .findByUser_IdAndDateBetween(userId, monthStart, monthEnd).stream()
                .collect(Collectors.groupingBy(Task::getDate));

        List<Routine> activeRoutines = routineRepository.findByUser_IdOrderByCreatedAtAsc(userId).stream()
                .filter(Routine::isActive)
                .toList();

        Map<LocalDate, Set<Long>> doneRoutineIdsByDate = doneRoutineIdsByDate(activeRoutines, monthStart, monthEnd);

        Map<LocalDate, List<EventResponse>> eventsByDate = eventService.listByMonth(userId, month).stream()
                .collect(Collectors.groupingBy(EventResponse::occurrenceDate));

        List<CalendarDayResponse> days = monthStart.datesUntil(monthEnd.plusDays(1))
                .map(date -> {
                    List<CalendarTaskItem> taskItems = tasksByDate.getOrDefault(date, List.of()).stream()
                            .map(task -> new CalendarTaskItem(task.getId(), task.getTitle(), task.isDone(),
                                    CategorySummary.from(task.getCategory())))
                            .toList();

                    DayOfWeek dayOfWeek = date.getDayOfWeek();
                    Set<Long> doneRoutineIds = doneRoutineIdsByDate.getOrDefault(date, Set.of());
                    List<CalendarRoutineItem> routineItems = activeRoutines.stream()
                            .filter(routine -> routine.getDaysOfWeek().contains(dayOfWeek))
                            .map(routine -> new CalendarRoutineItem(routine.getId(), routine.getTitle(),
                                    doneRoutineIds.contains(routine.getId())))
                            .toList();

                    List<CalendarEventItem> eventItems = eventsByDate.getOrDefault(date, List.of()).stream()
                            .map(event -> new CalendarEventItem(event.id(), event.title(), event.category()))
                            .toList();

                    return new CalendarDayResponse(date, taskItems, routineItems, eventItems);
                })
                .toList();

        return new CalendarMonthResponse(month.toString(), days);
    }

    private Map<LocalDate, Set<Long>> doneRoutineIdsByDate(List<Routine> activeRoutines, LocalDate monthStart, LocalDate monthEnd) {
        if (activeRoutines.isEmpty()) {
            return Map.of();
        }
        List<Long> routineIds = activeRoutines.stream().map(Routine::getId).toList();
        return routineCompletionRepository
                .findByRoutine_IdInAndDateBetween(routineIds, monthStart, monthEnd).stream()
                .collect(Collectors.groupingBy(RoutineCompletion::getDate,
                        Collectors.mapping(completion -> completion.getRoutine().getId(), Collectors.toSet())));
    }
}
