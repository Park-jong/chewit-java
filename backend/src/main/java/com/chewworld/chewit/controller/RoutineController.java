package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.RoutineDtos.CreateRoutineRequest;
import com.chewworld.chewit.dto.RoutineDtos.RoutineResponse;
import com.chewworld.chewit.dto.RoutineDtos.UpdateRoutineRequest;
import com.chewworld.chewit.security.UserPrincipal;
import com.chewworld.chewit.service.RoutineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/routines")
@RequiredArgsConstructor
public class RoutineController {

    private final RoutineService routineService;

    @GetMapping
    public List<RoutineResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return routineService.listAll(principal.userId());
    }

    @GetMapping("/today")
    public List<RoutineResponse> listByDate(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return routineService.listByDate(principal.userId(), targetDate);
    }

    @PostMapping
    public RoutineResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateRoutineRequest request
    ) {
        return routineService.create(principal.userId(), request);
    }

    @PatchMapping("/{id}")
    public RoutineResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoutineRequest request
    ) {
        return routineService.update(principal.userId(), id, request);
    }

    @PatchMapping("/{id}/toggle")
    public RoutineResponse toggle(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return routineService.toggleCompletion(principal.userId(), id, date);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        routineService.delete(principal.userId(), id);
    }
}
