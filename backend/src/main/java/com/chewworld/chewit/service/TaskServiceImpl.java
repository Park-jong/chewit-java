package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.TaskDtos.CreateTaskRequest;
import com.chewworld.chewit.dto.TaskDtos.TaskResponse;
import com.chewworld.chewit.dto.TaskDtos.UpdateTaskRequest;
import com.chewworld.chewit.entity.Task;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.repository.TaskRepository;
import com.chewworld.chewit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> listByDate(Long userId, LocalDate date) {
        return taskRepository.findByUser_IdAndDateOrderByCreatedAtAsc(userId, date).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public TaskResponse create(Long userId, CreateTaskRequest request) {
        Task task = Task.builder()
                .user(userRepository.getReferenceById(userId))
                .title(request.title())
                .memo(request.memo())
                .date(request.date())
                .build();
        taskRepository.save(task);
        return toResponse(task);
    }

    @Override
    @Transactional
    public TaskResponse update(Long userId, Long taskId, UpdateTaskRequest request) {
        Task task = getOwnedTask(userId, taskId);
        task.setTitle(request.title());
        task.setMemo(request.memo());
        task.setDate(request.date());
        return toResponse(task);
    }

    @Override
    @Transactional
    public TaskResponse toggleDone(Long userId, Long taskId) {
        Task task = getOwnedTask(userId, taskId);
        task.setDone(!task.isDone());
        return toResponse(task);
    }

    @Override
    @Transactional
    public void delete(Long userId, Long taskId) {
        Task task = getOwnedTask(userId, taskId);
        taskRepository.delete(task);
    }

    private Task getOwnedTask(Long userId, Long taskId) {
        return taskRepository.findByIdAndUser_Id(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("할일을 찾을 수 없습니다."));
    }

    private TaskResponse toResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getMemo(),
                task.getDate(),
                task.isDone(),
                task.getCreatedAt()
        );
    }
}
