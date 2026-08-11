package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.EventDtos.CreateEventRequest;
import com.chewworld.chewit.dto.EventDtos.EventResponse;
import com.chewworld.chewit.dto.EventDtos.UpdateEventRequest;
import com.chewworld.chewit.entity.Event;
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
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> listByMonth(Long userId, YearMonth month) {
        return eventRepository.findByUser_IdOrderByDateAsc(userId).stream()
                .flatMap(event -> occurrencesInMonth(event, month).stream()
                        .map(occurrenceDate -> toResponse(event, occurrenceDate)))
                .sorted(Comparator.comparing(EventResponse::occurrenceDate))
                .toList();
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
                .build();
        eventRepository.save(event);
        return toResponse(event, event.getDate());
    }

    @Override
    @Transactional
    public EventResponse update(Long userId, Long eventId, UpdateEventRequest request) {
        Event event = getOwnedEvent(userId, eventId);
        event.setTitle(request.title());
        event.setMemo(request.memo());
        event.setDate(request.date());
        event.setRecurrence(request.recurrence());
        return toResponse(event, event.getDate());
    }

    @Override
    @Transactional
    public void delete(Long userId, Long eventId) {
        Event event = getOwnedEvent(userId, eventId);
        eventRepository.delete(event);
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

    private EventResponse toResponse(Event event, LocalDate occurrenceDate) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getMemo(),
                event.getDate(),
                event.getRecurrence(),
                occurrenceDate,
                event.getCreatedAt()
        );
    }
}
