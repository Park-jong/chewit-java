package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.RoutineDtos.CreateRoutineRequest;
import com.chewworld.chewit.dto.RoutineDtos.RoutineResponse;
import com.chewworld.chewit.dto.RoutineDtos.UpdateRoutineRequest;

import java.time.LocalDate;
import java.util.List;

public interface RoutineService {

    List<RoutineResponse> listAll(Long userId);

    List<RoutineResponse> listByDate(Long userId, LocalDate date);

    RoutineResponse create(Long userId, CreateRoutineRequest request);

    RoutineResponse update(Long userId, Long routineId, UpdateRoutineRequest request);

    RoutineResponse toggleCompletion(Long userId, Long routineId, LocalDate date);

    void delete(Long userId, Long routineId);
}
