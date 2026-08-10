package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.RoutineDtos.CreateRoutineRequest;
import com.chewworld.chewit.dto.RoutineDtos.RoutineResponse;
import com.chewworld.chewit.dto.RoutineDtos.UpdateRoutineRequest;
import com.chewworld.chewit.security.UserPrincipal;
import jakarta.validation.Valid;
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

import java.time.LocalDate;
import java.util.List;

@RequestMapping("/api/routines")
public interface RoutineController {

    @GetMapping
    List<RoutineResponse> list(
            @AuthenticationPrincipal UserPrincipal principal
    );

    @GetMapping("/today")
    List<RoutineResponse> listByDate(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    );

    @PostMapping
    RoutineResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateRoutineRequest request
    );

    @PatchMapping("/{id}")
    RoutineResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoutineRequest request
    );

    @PatchMapping("/{id}/toggle")
    RoutineResponse toggle(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    );

    @DeleteMapping("/{id}")
    void delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    );
}
