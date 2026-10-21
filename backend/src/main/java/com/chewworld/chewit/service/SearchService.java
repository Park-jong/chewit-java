package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.SearchDtos.SearchResponse;

public interface SearchService {

    SearchResponse search(Long userId, String query, Long categoryId);
}
