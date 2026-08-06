package com.chewworld.chewit.repository;

import com.chewworld.chewit.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUser_IdAndDateOrderByCreatedAtAsc(Long userId, LocalDate date);

    Optional<Task> findByIdAndUser_Id(Long id, Long userId);
}
