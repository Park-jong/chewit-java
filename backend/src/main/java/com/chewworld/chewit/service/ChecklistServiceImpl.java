package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
import com.chewworld.chewit.dto.ChecklistDtos.ChecklistItemResponse;
import com.chewworld.chewit.dto.ChecklistDtos.ChecklistResponse;
import com.chewworld.chewit.dto.ChecklistDtos.CreateChecklistItemRequest;
import com.chewworld.chewit.dto.ChecklistDtos.CreateChecklistRequest;
import com.chewworld.chewit.dto.ChecklistDtos.ReorderItemsRequest;
import com.chewworld.chewit.dto.ChecklistDtos.UpdateChecklistItemRequest;
import com.chewworld.chewit.dto.ChecklistDtos.UpdateChecklistRequest;
import com.chewworld.chewit.entity.Checklist;
import com.chewworld.chewit.entity.ChecklistItem;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.repository.ChecklistRepository;
import com.chewworld.chewit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChecklistServiceImpl implements ChecklistService {

    private final ChecklistRepository checklistRepository;
    private final UserRepository userRepository;
    private final CategoryService categoryService;

    @Override
    @Transactional(readOnly = true)
    public List<ChecklistResponse> listAll(Long userId) {
        return checklistRepository.findByUser_IdOrderByCreatedAtAsc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ChecklistResponse create(Long userId, CreateChecklistRequest request) {
        Checklist checklist = Checklist.builder()
                .user(userRepository.getReferenceById(userId))
                .title(request.title())
                .category(categoryService.resolveOwned(userId, request.categoryId()))
                .build();
        checklistRepository.save(checklist);
        return toResponse(checklist);
    }

    @Override
    @Transactional
    public ChecklistResponse rename(Long userId, Long checklistId, UpdateChecklistRequest request) {
        Checklist checklist = getOwnedChecklist(userId, checklistId);
        checklist.setTitle(request.title());
        checklist.setCategory(categoryService.resolveOwned(userId, request.categoryId()));
        return toResponse(checklist);
    }

    @Override
    @Transactional
    public void delete(Long userId, Long checklistId) {
        Checklist checklist = getOwnedChecklist(userId, checklistId);
        checklistRepository.delete(checklist);
    }

    @Override
    @Transactional
    public ChecklistResponse addItem(Long userId, Long checklistId, CreateChecklistItemRequest request) {
        Checklist checklist = getOwnedChecklist(userId, checklistId);
        ChecklistItem item = ChecklistItem.builder()
                .checklist(checklist)
                .content(request.content())
                .sortOrder(checklist.getItems().size())
                .build();
        checklist.getItems().add(item);
        checklistRepository.flush();
        return toResponse(checklist);
    }

    @Override
    @Transactional
    public ChecklistResponse updateItem(Long userId, Long checklistId, Long itemId, UpdateChecklistItemRequest request) {
        Checklist checklist = getOwnedChecklist(userId, checklistId);
        ChecklistItem item = getItem(checklist, itemId);
        item.setContent(request.content());
        return toResponse(checklist);
    }

    @Override
    @Transactional
    public ChecklistResponse toggleItem(Long userId, Long checklistId, Long itemId) {
        Checklist checklist = getOwnedChecklist(userId, checklistId);
        ChecklistItem item = getItem(checklist, itemId);
        item.setChecked(!item.isChecked());
        return toResponse(checklist);
    }

    @Override
    @Transactional
    public ChecklistResponse deleteItem(Long userId, Long checklistId, Long itemId) {
        Checklist checklist = getOwnedChecklist(userId, checklistId);
        ChecklistItem item = getItem(checklist, itemId);
        checklist.getItems().remove(item);
        return toResponse(checklist);
    }

    @Override
    @Transactional
    public ChecklistResponse reorderItems(Long userId, Long checklistId, ReorderItemsRequest request) {
        Checklist checklist = getOwnedChecklist(userId, checklistId);
        Map<Long, ChecklistItem> itemsById = checklist.getItems().stream()
                .collect(Collectors.toMap(ChecklistItem::getId, item -> item));

        List<Long> itemIds = request.itemIds();
        if (itemIds.size() != itemsById.size() || !itemsById.keySet().containsAll(itemIds)) {
            throw new ResourceNotFoundException("체크리스트 항목을 찾을 수 없습니다.");
        }

        for (int i = 0; i < itemIds.size(); i++) {
            itemsById.get(itemIds.get(i)).setSortOrder(i);
        }
        return toResponse(checklist);
    }

    private Checklist getOwnedChecklist(Long userId, Long checklistId) {
        return checklistRepository.findByIdAndUser_Id(checklistId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("체크리스트를 찾을 수 없습니다."));
    }

    private ChecklistItem getItem(Checklist checklist, Long itemId) {
        return checklist.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("체크리스트 항목을 찾을 수 없습니다."));
    }

    private ChecklistResponse toResponse(Checklist checklist) {
        List<ChecklistItemResponse> items = checklist.getItems().stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .map(item -> new ChecklistItemResponse(item.getId(), item.getContent(), item.isChecked(), item.getSortOrder()))
                .toList();
        return new ChecklistResponse(checklist.getId(), checklist.getTitle(), items, checklist.getCreatedAt(),
                CategorySummary.from(checklist.getCategory()));
    }
}
