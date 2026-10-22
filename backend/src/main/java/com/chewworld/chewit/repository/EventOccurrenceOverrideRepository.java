package com.chewworld.chewit.repository;

import com.chewworld.chewit.entity.EventOccurrenceOverride;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EventOccurrenceOverrideRepository extends JpaRepository<EventOccurrenceOverride, Long> {

    List<EventOccurrenceOverride> findByEvent_IdInAndOccurrenceDateBetween(
            Collection<Long> eventIds, LocalDate start, LocalDate end);

    Optional<EventOccurrenceOverride> findByEvent_IdAndOccurrenceDate(Long eventId, LocalDate occurrenceDate);

    // 내보내기용: 사용자 소유 시리즈의 모든 override
    @EntityGraph(attributePaths = "event")
    List<EventOccurrenceOverride> findByEvent_User_IdOrderByOccurrenceDateAsc(Long userId);

    void deleteByEvent_Id(Long eventId);
}
