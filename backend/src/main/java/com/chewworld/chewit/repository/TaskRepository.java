package com.chewworld.chewit.repository;

import com.chewworld.chewit.entity.Task;
import org.springframework.data.domain.Pageable;
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

    // pattern은 SearchServiceImpl.toLikePattern 결과(소문자, '!' escape)
    @EntityGraph(attributePaths = "category")
    @Query("""
            select t from Task t
            where t.user.id = :userId
              and (:categoryId is null or t.category.id = :categoryId)
              and (lower(t.title) like :pattern escape '!' or lower(t.memo) like :pattern escape '!')
            order by t.date desc, t.id desc
            """)
    List<Task> search(@Param("userId") Long userId, @Param("pattern") String pattern,
                      @Param("categoryId") Long categoryId, Pageable pageable);

    // 내보내기용: 전체 조회(카테고리 함께)
    @EntityGraph(attributePaths = "category")
    List<Task> findByUser_IdOrderByDateAscIdAsc(Long userId);

    Optional<Task> findByIdAndUser_Id(Long id, Long userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Task t set t.category = null where t.category.id = :categoryId")
    void clearCategory(@Param("categoryId") Long categoryId);
}
