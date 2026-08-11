package com.chewworld.chewit.repository;

import com.chewworld.chewit.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByUser_IdOrderByDateAsc(Long userId);

    Optional<Event> findByIdAndUser_Id(Long id, Long userId);
}
