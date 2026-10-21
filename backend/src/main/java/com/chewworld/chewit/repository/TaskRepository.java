package com.chewworld.chewit.repository;

import com.chewworld.chewit.entity.Task;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @EntityGraph(attributePaths = "category")
    List<Task> findByUser_IdAndDateOrderByCreatedAtAsc(Long userId, LocalDate date);

    List<Task> findByUser_IdAndDateAndDoneFalse(Long userId, LocalDate date);

    @EntityGraph(attributePaths = "category")
    List<Task> findByUser_IdAndDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    Optional<Task> findByIdAndUser_Id(Long id, Long userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Task t set t.category = null where t.category.id = :categoryId")
    void clearCategory(@Param("categoryId") Long categoryId);
}
