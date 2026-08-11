package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.ChecklistDtos.ChecklistResponse;
import com.chewworld.chewit.dto.ChecklistDtos.CreateChecklistItemRequest;
import com.chewworld.chewit.dto.ChecklistDtos.CreateChecklistRequest;
import com.chewworld.chewit.dto.ChecklistDtos.ReorderItemsRequest;
import com.chewworld.chewit.dto.ChecklistDtos.UpdateChecklistItemRequest;
import com.chewworld.chewit.dto.ChecklistDtos.UpdateChecklistRequest;

import java.util.List;

public interface ChecklistService {

    List<ChecklistResponse> listAll(Long userId);

    ChecklistResponse create(Long userId, CreateChecklistRequest request);

    ChecklistResponse rename(Long userId, Long checklistId, UpdateChecklistRequest request);

    void delete(Long userId, Long checklistId);

    ChecklistResponse addItem(Long userId, Long checklistId, CreateChecklistItemRequest request);

    ChecklistResponse updateItem(Long userId, Long checklistId, Long itemId, UpdateChecklistItemRequest request);

    ChecklistResponse toggleItem(Long userId, Long checklistId, Long itemId);

    ChecklistResponse deleteItem(Long userId, Long checklistId, Long itemId);

    ChecklistResponse reorderItems(Long userId, Long checklistId, ReorderItemsRequest request);
}
