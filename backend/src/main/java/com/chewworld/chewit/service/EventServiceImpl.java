package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
import com.chewworld.chewit.dto.EventDtos.CreateEventRequest;
import com.chewworld.chewit.dto.EventDtos.EventResponse;
import com.chewworld.chewit.dto.EventDtos.UpdateEventRequest;
import com.chewworld.chewit.dto.EventDtos.UpdateOccurrenceRequest;
import com.chewworld.chewit.entity.Event;
import com.chewworld.chewit.entity.EventOccurrenceOverride;
import com.chewworld.chewit.entity.RecurrenceType;
import com.chewworld.chewit.exception.InvalidRequestException;
import com.chewworld.chewit.repository.EventOccurrenceOverrideRepository;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.repository.EventRepository;
import com.chewworld.chewit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final EventOccurrenceOverrideRepository overrideRepository;
    private final UserRepository userRepository;
    private final CategoryService categoryService;

    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> listByMonth(Long userId, YearMonth month) {
        List<Event> events = eventRepository.findByUser_IdOrderByDateAsc(userId);
        if (events.isEmpty()) {
            return List.of();
        }
        // 회차 계산 + override 반영의 단일 지점: Calendar/Stats도 이 메서드를 재사용한다.
        Map<String, EventOccurrenceOverride> overrides = new HashMap<>();
        overrideRepository.findByEvent_IdInAndOccurrenceDateBetween(
                events.stream().map(Event::getId).toList(), month.atDay(1), month.atEndOfMonth())
                .forEach(o -> overrides.put(o.getEvent().getId() + "|" + o.getOccurrenceDate(), o));

        List<EventResponse> responses = new ArrayList<>();
        for (Event event : events) {
            for (LocalDate occurrenceDate : occurrencesInMonth(event, month)) {
                EventOccurrenceOverride override = overrides.get(event.getId() + "|" + occurrenceDate);
                if (override != null && override.isSkipped()) {
                    continue;
                }
                responses.add(toResponse(event, occurrenceDate, override));
            }
        }
        responses.sort(Comparator.comparing(EventResponse::occurrenceDate));
        return responses;
    }

    @Override
    @Transactional
    public EventResponse create(Long userId, CreateEventRequest request) {
        Event event = Event.builder()
                .user(userRepository.getReferenceById(userId))
                .title(request.title())
                .memo(request.memo())
                .date(request.date())
                .recurrence(request.recurrence())
                .category(categoryService.resolveOwned(userId, request.categoryId()))
                .build();
        eventRepository.save(event);
        return toResponse(event, event.getDate(), null);
    }

    @Override
    @Transactional
    public EventResponse update(Long userId, Long eventId, UpdateEventRequest request) {
        Event event = getOwnedEvent(userId, eventId);
        // 앵커(date)/recurrence가 바뀌면 기존 회차 override는 의미를 잃으므로 모두 정리한다.
        if (!event.getDate().equals(request.date()) || event.getRecurrence() != request.recurrence()) {
            overrideRepository.deleteByEvent_Id(eventId);
        }
        event.setTitle(request.title());
        event.setMemo(request.memo());
        event.setDate(request.date());
        event.setRecurrence(request.recurrence());
        event.setCategory(categoryService.resolveOwned(userId, request.categoryId()));
        return toResponse(event, event.getDate(), null);
    }

    @Override
    @Transactional
    public void delete(Long userId, Long eventId) {
        Event event = getOwnedEvent(userId, eventId);
        overrideRepository.deleteByEvent_Id(eventId); // FK 제약 때문에 먼저 삭제
        eventRepository.delete(event);
    }

    @Override
    @Transactional
    public void deleteOccurrence(Long userId, Long eventId, LocalDate occurrenceDate) {
        Event event = getOwnedRecurringEvent(userId, eventId, occurrenceDate);
        EventOccurrenceOverride override = findOrCreateOverride(event, occurrenceDate);
        override.setSkipped(true);
        overrideRepository.save(override);
    }

    @Override
    @Transactional
    public EventResponse updateOccurrence(Long userId, Long eventId, LocalDate occurrenceDate,
                                          UpdateOccurrenceRequest request) {
        Event event = getOwnedRecurringEvent(userId, eventId, occurrenceDate);
        EventOccurrenceOverride override = findOrCreateOverride(event, occurrenceDate);
        override.setSkipped(false);
        override.setTitle(request.title());
        override.setMemo(request.memo());
        overrideRepository.save(override);
        return toResponse(event, occurrenceDate, override);
    }

    private Event getOwnedRecurringEvent(Long userId, Long eventId, LocalDate occurrenceDate) {
        Event event = getOwnedEvent(userId, eventId);
        if (event.getRecurrence() == RecurrenceType.NONE) {
            throw new InvalidRequestException("반복 이벤트가 아닙니다.");
        }
        if (!occurrencesInMonth(event, YearMonth.from(occurrenceDate)).contains(occurrenceDate)) {
            throw new InvalidRequestException("유효한 반복 회차가 아닙니다.");
        }
        return event;
    }

    private EventOccurrenceOverride findOrCreateOverride(Event event, LocalDate occurrenceDate) {
        return overrideRepository.findByEvent_IdAndOccurrenceDate(event.getId(), occurrenceDate)
                .orElseGet(() -> EventOccurrenceOverride.builder()
                        .event(event)
                        .occurrenceDate(occurrenceDate)
                        .build());
    }

    private Event getOwnedEvent(Long userId, Long eventId) {
        return eventRepository.findByIdAndUser_Id(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("이벤트를 찾을 수 없습니다."));
    }

    private List<LocalDate> occurrencesInMonth(Event event, YearMonth month) {
        LocalDate anchor = event.getDate();
        LocalDate monthStart = month.atDay(1);
        LocalDate monthEnd = month.atEndOfMonth();
        if (anchor.isAfter(monthEnd)) {
            return List.of();
        }

        List<LocalDate> occurrences = new ArrayList<>();
        switch (event.getRecurrence()) {
            case NONE -> {
                if (!anchor.isBefore(monthStart)) {
                    occurrences.add(anchor);
                }
            }
            case WEEKLY -> {
                LocalDate cursor = anchor;
                while (cursor.isBefore(monthStart)) {
                    cursor = cursor.plusWeeks(1);
                }
                while (!cursor.isAfter(monthEnd)) {
                    occurrences.add(cursor);
                    cursor = cursor.plusWeeks(1);
                }
            }
            case MONTHLY -> {
                if (!YearMonth.from(anchor).isAfter(month)) {
                    occurrences.add(month.atDay(Math.min(anchor.getDayOfMonth(), month.lengthOfMonth())));
                }
            }
            case YEARLY -> {
                YearMonth anchorYearMonth = YearMonth.from(anchor);
                if (month.getMonthValue() == anchorYearMonth.getMonthValue() && !anchorYearMonth.isAfter(month)) {
                    occurrences.add(month.atDay(Math.min(anchor.getDayOfMonth(), month.lengthOfMonth())));
                }
            }
        }
        return occurrences;
    }

    private EventResponse toResponse(Event event, LocalDate occurrenceDate, EventOccurrenceOverride override) {
        String title = override != null && override.getTitle() != null ? override.getTitle() : event.getTitle();
        String memo = override != null && override.getMemo() != null ? override.getMemo() : event.getMemo();
        return new EventResponse(
                event.getId(),
                title,
                memo,
                event.getDate(),
                event.getRecurrence(),
                occurrenceDate,
                event.getCreatedAt(),
                CategorySummary.from(event.getCategory()),
                override != null
        );
    }
}
