package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.SearchDtos.SearchResponse;
import com.chewworld.chewit.security.UserPrincipal;
import com.chewworld.chewit.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    // q 누락/빈 값/길이 검증은 서비스에서 InvalidRequestException(400)으로 처리한다.
    @GetMapping
    public SearchResponse search(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId
    ) {
        return searchService.search(principal.userId(), q, categoryId);
    }
}
