package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.TaskDtos.CarryOverRequest;
import com.chewworld.chewit.dto.TaskDtos.CarryOverResponse;
import com.chewworld.chewit.dto.TaskDtos.CreateTaskRequest;
import com.chewworld.chewit.dto.TaskDtos.TaskResponse;
import com.chewworld.chewit.dto.TaskDtos.UpdateTaskRequest;
import com.chewworld.chewit.security.UserPrincipal;
import com.chewworld.chewit.service.TaskService;
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
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public List<TaskResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return taskService.listByDate(principal.userId(), targetDate);
    }

    @PostMapping
    public TaskResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        return taskService.create(principal.userId(), request);
    }

    @PostMapping("/carry-over")
    public CarryOverResponse carryOver(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CarryOverRequest request
    ) {
        return taskService.carryOver(principal.userId(), request);
    }

    @PatchMapping("/{id}")
    public TaskResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
        return taskService.update(principal.userId(), id, request);
    }

    @PatchMapping("/{id}/toggle")
    public TaskResponse toggle(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return taskService.toggleDone(principal.userId(), id);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        taskService.delete(principal.userId(), id);
    }
}
