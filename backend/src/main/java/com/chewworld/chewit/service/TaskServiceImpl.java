package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
import com.chewworld.chewit.dto.TaskDtos.CarryOverRequest;
import com.chewworld.chewit.dto.TaskDtos.CarryOverResponse;
import com.chewworld.chewit.dto.TaskDtos.CreateTaskRequest;
import com.chewworld.chewit.dto.TaskDtos.TaskResponse;
import com.chewworld.chewit.dto.TaskDtos.UpdateTaskRequest;
import com.chewworld.chewit.entity.Task;
import com.chewworld.chewit.exception.InvalidRequestException;
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
    private final CategoryService categoryService;

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
                .category(categoryService.resolveOwned(userId, request.categoryId()))
                .priority(request.priority())
                .startTime(request.startTime())
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
        task.setCategory(categoryService.resolveOwned(userId, request.categoryId()));
        task.setPriority(request.priority());
        task.setStartTime(request.startTime());
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
    public CarryOverResponse carryOver(Long userId, CarryOverRequest request) {
        if (request.fromDate().equals(request.toDate())) {
            throw new InvalidRequestException("이월할 날짜가 같은 날짜입니다.");
        }
        if (request.toDate().isBefore(request.fromDate())) {
            throw new InvalidRequestException("과거 날짜로는 이월할 수 없습니다.");
        }
        List<Task> tasks = taskRepository.findByUser_IdAndDateAndDoneFalse(userId, request.fromDate());
        tasks.forEach(task -> task.setDate(request.toDate()));
        return new CarryOverResponse(tasks.size(), request.toDate());
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
                task.getCreatedAt(),
                CategorySummary.from(task.getCategory()),
                task.getPriority(),
                task.getStartTime()
        );
    }
}
