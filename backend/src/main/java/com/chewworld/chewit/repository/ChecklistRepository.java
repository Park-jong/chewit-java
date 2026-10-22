package com.chewworld.chewit.repository;

import com.chewworld.chewit.entity.Checklist;
import org.springframework.data.domain.Pageable;
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

    // 제목 또는 아이템 content가 맞는 체크리스트
    @EntityGraph(attributePaths = "category")
    @Query("""
            select c from Checklist c
            where c.user.id = :userId
              and (:categoryId is null or c.category.id = :categoryId)
              and (lower(c.title) like :pattern escape '!'
                   or exists (select 1 from ChecklistItem i
                              where i.checklist = c and lower(i.content) like :pattern escape '!'))
            order by c.createdAt desc, c.id desc
            """)
    List<Checklist> search(@Param("userId") Long userId, @Param("pattern") String pattern,
                           @Param("categoryId") Long categoryId, Pageable pageable);

    @Query("select distinct c from Checklist c left join fetch c.items where c.id in :ids")
    List<Checklist> findWithItemsByIdIn(@Param("ids") List<Long> ids);

    // 내보내기용: 카테고리와 항목을 한 번에 조회한다.
    @EntityGraph(attributePaths = {"category", "items"})
    List<Checklist> findWithDetailsByUser_IdOrderByCreatedAtAsc(Long userId);

    Optional<Checklist> findByIdAndUser_Id(Long id, Long userId);

    // 복제용: 카테고리와 항목을 한 번에 조회한다.
    @EntityGraph(attributePaths = {"category", "items"})
    Optional<Checklist> findWithDetailsByIdAndUser_Id(Long id, Long userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Checklist c set c.category = null where c.category.id = :categoryId")
    void clearCategory(@Param("categoryId") Long categoryId);
}
