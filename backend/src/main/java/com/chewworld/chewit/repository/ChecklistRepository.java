package com.chewworld.chewit.repository;

import com.chewworld.chewit.entity.Checklist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChecklistRepository extends JpaRepository<Checklist, Long> {

    List<Checklist> findByUser_IdOrderByCreatedAtAsc(Long userId);

    Optional<Checklist> findByIdAndUser_Id(Long id, Long userId);
}
