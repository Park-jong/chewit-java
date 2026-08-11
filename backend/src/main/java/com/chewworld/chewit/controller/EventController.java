package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.EventDtos.CreateEventRequest;
import com.chewworld.chewit.dto.EventDtos.EventResponse;
import com.chewworld.chewit.dto.EventDtos.UpdateEventRequest;
import com.chewworld.chewit.security.UserPrincipal;
import com.chewworld.chewit.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public List<EventResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month
    ) {
        YearMonth targetMonth = month != null ? YearMonth.parse(month) : YearMonth.now();
        return eventService.listByMonth(principal.userId(), targetMonth);
    }

    @PostMapping
    public EventResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateEventRequest request
    ) {
        return eventService.create(principal.userId(), request);
    }

    @PatchMapping("/{id}")
    public EventResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateEventRequest request
    ) {
        return eventService.update(principal.userId(), id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        eventService.delete(principal.userId(), id);
    }
}
