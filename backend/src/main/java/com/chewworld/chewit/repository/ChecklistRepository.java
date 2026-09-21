package com.chewworld.chewit.repository;

import com.chewworld.chewit.entity.Checklist;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChecklistRepository extends JpaRepository<Checklist, Long> {

    @EntityGraph(attributePaths = "category")
    List<Checklist> findByUser_IdOrderByCreatedAtAsc(Long userId);

    Optional<Checklist> findByIdAndUser_Id(Long id, Long userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Checklist c set c.category = null where c.category.id = :categoryId")
    void clearCategory(@Param("categoryId") Long categoryId);
}
