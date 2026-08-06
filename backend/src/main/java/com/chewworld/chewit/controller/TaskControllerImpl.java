package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.TaskDtos.CreateTaskRequest;
import com.chewworld.chewit.dto.TaskDtos.TaskResponse;
import com.chewworld.chewit.dto.TaskDtos.UpdateTaskRequest;
import com.chewworld.chewit.security.UserPrincipal;
import com.chewworld.chewit.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class TaskControllerImpl implements TaskController {

    private final TaskService taskService;

    @Override
    public List<TaskResponse> list(UserPrincipal principal, LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return taskService.listByDate(principal.userId(), targetDate);
    }

    @Override
    public TaskResponse create(UserPrincipal principal, CreateTaskRequest request) {
        return taskService.create(principal.userId(), request);
    }

    @Override
    public TaskResponse update(UserPrincipal principal, Long id, UpdateTaskRequest request) {
        return taskService.update(principal.userId(), id, request);
    }

    @Override
    public TaskResponse toggle(UserPrincipal principal, Long id) {
        return taskService.toggleDone(principal.userId(), id);
    }

    @Override
    public void delete(UserPrincipal principal, Long id) {
        taskService.delete(principal.userId(), id);
    }
}
