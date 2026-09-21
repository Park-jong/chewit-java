package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.TaskDtos.CarryOverRequest;
import com.chewworld.chewit.dto.TaskDtos.CarryOverResponse;
import com.chewworld.chewit.dto.TaskDtos.CreateTaskRequest;
import com.chewworld.chewit.dto.TaskDtos.TaskResponse;
import com.chewworld.chewit.dto.TaskDtos.UpdateTaskRequest;

import java.time.LocalDate;
import java.util.List;

public interface TaskService {

    List<TaskResponse> listByDate(Long userId, LocalDate date);

    TaskResponse create(Long userId, CreateTaskRequest request);

    TaskResponse update(Long userId, Long taskId, UpdateTaskRequest request);

    TaskResponse toggleDone(Long userId, Long taskId);

    CarryOverResponse carryOver(Long userId, CarryOverRequest request);

    void delete(Long userId, Long taskId);
}
