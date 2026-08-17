package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.TaskDtos.CreateTaskRequest;
import com.chewworld.chewit.dto.TaskDtos.TaskResponse;
import com.chewworld.chewit.dto.TaskDtos.UpdateTaskRequest;
import com.chewworld.chewit.entity.Task;
import com.chewworld.chewit.entity.User;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.repository.TaskRepository;
import com.chewworld.chewit.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    private static final Long USER_ID = 1L;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskServiceImpl taskService;

    @Test
    void listByDate_해당_날짜의_할일을_반환한다() {
        LocalDate date = LocalDate.of(2026, 8, 17);
        Task task = Task.builder().id(1L).title("할일").date(date).build();
        when(taskRepository.findByUser_IdAndDateOrderByCreatedAtAsc(USER_ID, date))
                .thenReturn(List.of(task));

        List<TaskResponse> responses = taskService.listByDate(USER_ID, date);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).title()).isEqualTo("할일");
    }

    @Test
    void create_할일을_생성한다() {
        LocalDate date = LocalDate.of(2026, 8, 17);
        CreateTaskRequest request = new CreateTaskRequest("새 할일", "메모", date);
        User userRef = User.builder().id(USER_ID).build();
        when(userRepository.getReferenceById(USER_ID)).thenReturn(userRef);

        TaskResponse response = taskService.create(USER_ID, request);

        assertThat(response.title()).isEqualTo("새 할일");
        assertThat(response.memo()).isEqualTo("메모");
        assertThat(response.date()).isEqualTo(date);
        assertThat(response.done()).isFalse();
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void update_소유한_할일이면_수정한다() {
        Task task = Task.builder().id(1L).title("기존").date(LocalDate.of(2026, 8, 1)).build();
        when(taskRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(task));
        LocalDate newDate = LocalDate.of(2026, 8, 20);
        UpdateTaskRequest request = new UpdateTaskRequest("수정됨", "새메모", newDate);

        TaskResponse response = taskService.update(USER_ID, 1L, request);

        assertThat(response.title()).isEqualTo("수정됨");
        assertThat(response.memo()).isEqualTo("새메모");
        assertThat(response.date()).isEqualTo(newDate);
    }

    @Test
    void update_소유하지_않은_할일이면_예외() {
        when(taskRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.empty());
        UpdateTaskRequest request = new UpdateTaskRequest("수정됨", null, LocalDate.now());

        assertThatThrownBy(() -> taskService.update(USER_ID, 1L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void toggleDone_완료여부를_반전한다() {
        Task task = Task.builder().id(1L).title("할일").date(LocalDate.now()).done(false).build();
        when(taskRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(task));

        TaskResponse response = taskService.toggleDone(USER_ID, 1L);

        assertThat(response.done()).isTrue();
        assertThat(task.isDone()).isTrue();
    }

    @Test
    void delete_소유한_할일을_삭제한다() {
        Task task = Task.builder().id(1L).build();
        when(taskRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(task));

        taskService.delete(USER_ID, 1L);

        verify(taskRepository).delete(task);
    }

    @Test
    void delete_소유하지_않은_할일이면_예외() {
        when(taskRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.delete(USER_ID, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
