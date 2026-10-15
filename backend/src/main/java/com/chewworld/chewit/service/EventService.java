package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.EventDtos.CreateEventRequest;
import com.chewworld.chewit.dto.EventDtos.EventResponse;
import com.chewworld.chewit.dto.EventDtos.UpdateEventRequest;
import com.chewworld.chewit.dto.EventDtos.UpdateOccurrenceRequest;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

public interface EventService {

    List<EventResponse> listByMonth(Long userId, YearMonth month);

    EventResponse create(Long userId, CreateEventRequest request);

    EventResponse update(Long userId, Long eventId, UpdateEventRequest request);

    void delete(Long userId, Long eventId);

    /** 반복 이벤트의 특정 회차만 삭제한다. NONE 이벤트나 유효하지 않은 회차면 400. */
    void deleteOccurrence(Long userId, Long eventId, LocalDate occurrenceDate);

    /** 반복 이벤트의 특정 회차의 제목/메모만 수정한다. NONE 이벤트나 유효하지 않은 회차면 400. */
    EventResponse updateOccurrence(Long userId, Long eventId, LocalDate occurrenceDate, UpdateOccurrenceRequest request);
}
