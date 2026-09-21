package com.chewworld.chewit.repository;

import com.chewworld.chewit.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByUser_IdOrderByCreatedAtAsc(Long userId);

    Optional<Category> findByIdAndUser_Id(Long id, Long userId);

    boolean existsByUser_IdAndName(Long userId, String name);
}
