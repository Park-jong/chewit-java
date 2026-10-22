package com.chewworld.chewit.repository;

import com.chewworld.chewit.entity.Routine;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface RoutineRepository extends JpaRepository<Routine, Long> {

    List<Routine> findByUser_IdOrderByCreatedAtAsc(Long userId);

    // 내보내기용: 요일(ElementCollection)을 한 번에 조회해 루틴별 추가 쿼리를 막는다.
    @EntityGraph(attributePaths = "daysOfWeek")
    List<Routine> findWithDaysByUser_IdOrderByCreatedAtAsc(Long userId);

    Optional<Routine> findByIdAndUser_Id(Long id, Long userId);

    @Query("SELECT DISTINCT r FROM Routine r JOIN r.daysOfWeek d "
            + "WHERE r.user.id = :userId AND r.active = true AND d = :dayOfWeek "
            + "ORDER BY r.createdAt ASC")
    List<Routine> findActiveByUserIdAndDayOfWeek(@Param("userId") Long userId, @Param("dayOfWeek") DayOfWeek dayOfWeek);
}
