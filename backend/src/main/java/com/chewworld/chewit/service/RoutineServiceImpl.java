package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.RoutineDtos.CreateRoutineRequest;
import com.chewworld.chewit.dto.RoutineDtos.RoutineResponse;
import com.chewworld.chewit.dto.RoutineDtos.UpdateRoutineRequest;
import com.chewworld.chewit.entity.Routine;
import com.chewworld.chewit.entity.RoutineCompletion;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.repository.RoutineCompletionRepository;
import com.chewworld.chewit.repository.RoutineRepository;
import com.chewworld.chewit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoutineServiceImpl implements RoutineService {

    private final RoutineRepository routineRepository;
    private final RoutineCompletionRepository routineCompletionRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RoutineResponse> listAll(Long userId) {
        List<Routine> routines = routineRepository.findByUser_IdOrderByCreatedAtAsc(userId);
        Map<Long, Double> completionRates = computeCompletionRates(routines);
        return routines.stream()
                .map(routine -> toResponse(routine, false, completionRates.getOrDefault(routine.getId(), 0.0)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoutineResponse> listByDate(Long userId, LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        List<Routine> routines = routineRepository.findActiveByUserIdAndDayOfWeek(userId, dayOfWeek);
        if (routines.isEmpty()) {
            return List.of();
        }

        List<Long> routineIds = routines.stream().map(Routine::getId).toList();
        Set<Long> doneRoutineIds = routineCompletionRepository.findByRoutine_IdInAndDate(routineIds, date).stream()
                .map(completion -> completion.getRoutine().getId())
                .collect(Collectors.toSet());
        Map<Long, Double> completionRates = computeCompletionRates(routines);

        return routines.stream()
                .map(routine -> toResponse(routine, doneRoutineIds.contains(routine.getId()),
                        completionRates.getOrDefault(routine.getId(), 0.0)))
                .toList();
    }

    @Override
    @Transactional
    public RoutineResponse create(Long userId, CreateRoutineRequest request) {
        Routine routine = Routine.builder()
                .user(userRepository.getReferenceById(userId))
                .title(request.title())
                .memo(request.memo())
                .daysOfWeek(new HashSet<>(request.daysOfWeek()))
                .build();
        routineRepository.save(routine);
        return toResponse(routine, false, computeCompletionRate(routine));
    }

    @Override
    @Transactional
    public RoutineResponse update(Long userId, Long routineId, UpdateRoutineRequest request) {
        Routine routine = getOwnedRoutine(userId, routineId);
        routine.setTitle(request.title());
        routine.setMemo(request.memo());
        routine.getDaysOfWeek().clear();
        routine.getDaysOfWeek().addAll(request.daysOfWeek());
        routine.setActive(request.active());
        return toResponse(routine, false, computeCompletionRate(routine));
    }

    @Override
    @Transactional
    public RoutineResponse toggleCompletion(Long userId, Long routineId, LocalDate date) {
        Routine routine = getOwnedRoutine(userId, routineId);
        var existing = routineCompletionRepository.findByRoutine_IdAndDate(routineId, date);

        boolean nowDone;
        if (existing.isPresent()) {
            routineCompletionRepository.delete(existing.get());
            nowDone = false;
        } else {
            routineCompletionRepository.save(RoutineCompletion.builder().routine(routine).date(date).build());
            nowDone = true;
        }
        return toResponse(routine, nowDone, computeCompletionRate(routine));
    }

    @Override
    @Transactional
    public void delete(Long userId, Long routineId) {
        Routine routine = getOwnedRoutine(userId, routineId);
        routineCompletionRepository.deleteByRoutine_Id(routineId);
        routineRepository.delete(routine);
    }

    private Routine getOwnedRoutine(Long userId, Long routineId) {
        return routineRepository.findByIdAndUser_Id(routineId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("루틴을 찾을 수 없습니다."));
    }

    private double computeCompletionRate(Routine routine) {
        return computeCompletionRates(List.of(routine)).getOrDefault(routine.getId(), 0.0);
    }

    private Map<Long, Double> computeCompletionRates(List<Routine> routines) {
        if (routines.isEmpty()) {
            return Map.of();
        }

        LocalDate today = LocalDate.now();
        LocalDate windowStart = today.minusDays(today.getDayOfWeek().getValue() - 1L); // 이번 주 월요일
        List<Long> routineIds = routines.stream().map(Routine::getId).toList();
        Map<Long, List<LocalDate>> completionDatesByRoutineId = routineCompletionRepository
                .findByRoutine_IdInAndDateBetween(routineIds, windowStart, today).stream()
                .collect(Collectors.groupingBy(completion -> completion.getRoutine().getId(),
                        Collectors.mapping(RoutineCompletion::getDate, Collectors.toList())));

        Map<Long, Double> completionRates = new HashMap<>();
        for (Routine routine : routines) {
            LocalDate startDate = effectiveStartDate(routine, windowStart);
            int scheduled = 0;
            if (!startDate.isAfter(today)) {
                scheduled = (int) startDate.datesUntil(today.plusDays(1))
                        .filter(date -> routine.getDaysOfWeek().contains(date.getDayOfWeek()))
                        .count();
            }

            List<LocalDate> completionDates = completionDatesByRoutineId.getOrDefault(routine.getId(), List.of());
            int completed = (int) completionDates.stream()
                    .filter(date -> !date.isBefore(startDate) && !date.isAfter(today))
                    .count();

            completionRates.put(routine.getId(), completionRate(completed, scheduled));
        }
        return completionRates;
    }

    private LocalDate effectiveStartDate(Routine routine, LocalDate windowStart) {
        Instant createdAt = routine.getCreatedAt();
        if (createdAt == null) {
            return windowStart;
        }
        LocalDate createdDate = LocalDate.ofInstant(createdAt, ZoneId.systemDefault());
        return createdDate.isAfter(windowStart) ? createdDate : windowStart;
    }

    private double completionRate(int completed, int scheduled) {
        if (scheduled == 0) {
            return 0.0;
        }
        return Math.round((double) completed / scheduled * 10000) / 10000.0;
    }

    private RoutineResponse toResponse(Routine routine, boolean done, double completionRate) {
        return new RoutineResponse(
                routine.getId(),
                routine.getTitle(),
                routine.getMemo(),
                routine.getDaysOfWeek(),
                routine.isActive(),
                done,
                routine.getCreatedAt(),
                completionRate
        );
    }
}
