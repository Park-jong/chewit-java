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
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
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
        return routineRepository.findByUser_IdOrderByCreatedAtAsc(userId).stream()
                .map(routine -> toResponse(routine, false))
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

        return routines.stream()
                .map(routine -> toResponse(routine, doneRoutineIds.contains(routine.getId())))
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
        return toResponse(routine, false);
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
        return toResponse(routine, false);
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
        return toResponse(routine, nowDone);
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

    private RoutineResponse toResponse(Routine routine, boolean done) {
        return new RoutineResponse(
                routine.getId(),
                routine.getTitle(),
                routine.getMemo(),
                routine.getDaysOfWeek(),
                routine.isActive(),
                done,
                routine.getCreatedAt()
        );
    }
}
