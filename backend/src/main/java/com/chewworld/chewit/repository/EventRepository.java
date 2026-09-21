package com.chewworld.chewit.repository;

import com.chewworld.chewit.entity.Event;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    @EntityGraph(attributePaths = "category")
    List<Event> findByUser_IdOrderByDateAsc(Long userId);

    Optional<Event> findByIdAndUser_Id(Long id, Long userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Event e set e.category = null where e.category.id = :categoryId")
    void clearCategory(@Param("categoryId") Long categoryId);
}
