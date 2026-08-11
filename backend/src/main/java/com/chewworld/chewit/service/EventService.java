package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.EventDtos.CreateEventRequest;
import com.chewworld.chewit.dto.EventDtos.EventResponse;
import com.chewworld.chewit.dto.EventDtos.UpdateEventRequest;

import java.time.YearMonth;
import java.util.List;

public interface EventService {

    List<EventResponse> listByMonth(Long userId, YearMonth month);

    EventResponse create(Long userId, CreateEventRequest request);

    EventResponse update(Long userId, Long eventId, UpdateEventRequest request);

    void delete(Long userId, Long eventId);
}
