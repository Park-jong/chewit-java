package com.chewworld.chewit.repository;

import com.chewworld.chewit.entity.RoutineCompletion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RoutineCompletionRepository extends JpaRepository<RoutineCompletion, Long> {

    Optional<RoutineCompletion> findByRoutine_IdAndDate(Long routineId, LocalDate date);

    List<RoutineCompletion> findByRoutine_IdInAndDate(List<Long> routineIds, LocalDate date);

    List<RoutineCompletion> findByRoutine_IdInAndDateBetween(List<Long> routineIds, LocalDate startDate, LocalDate endDate);

    void deleteByRoutine_Id(Long routineId);
}
