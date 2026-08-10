package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.RoutineDtos.CreateRoutineRequest;
import com.chewworld.chewit.dto.RoutineDtos.RoutineResponse;
import com.chewworld.chewit.dto.RoutineDtos.UpdateRoutineRequest;
import com.chewworld.chewit.security.UserPrincipal;
import com.chewworld.chewit.service.RoutineService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class RoutineControllerImpl implements RoutineController {

    private final RoutineService routineService;

    @Override
    public List<RoutineResponse> list(UserPrincipal principal) {
        return routineService.listAll(principal.userId());
    }

    @Override
    public List<RoutineResponse> listByDate(UserPrincipal principal, LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return routineService.listByDate(principal.userId(), targetDate);
    }

    @Override
    public RoutineResponse create(UserPrincipal principal, CreateRoutineRequest request) {
        return routineService.create(principal.userId(), request);
    }

    @Override
    public RoutineResponse update(UserPrincipal principal, Long id, UpdateRoutineRequest request) {
        return routineService.update(principal.userId(), id, request);
    }

    @Override
    public RoutineResponse toggle(UserPrincipal principal, Long id, LocalDate date) {
        return routineService.toggleCompletion(principal.userId(), id, date);
    }

    @Override
    public void delete(UserPrincipal principal, Long id) {
        routineService.delete(principal.userId(), id);
    }
}
