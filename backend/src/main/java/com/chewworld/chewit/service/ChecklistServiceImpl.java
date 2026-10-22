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

    // checklists.title 컬럼 길이(JPA 기본 255)
    private static final int TITLE_MAX_LENGTH = 255;
    private static final String COPY_SUFFIX = " (복사본)";

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
    public ChecklistResponse duplicate(Long userId, Long checklistId) {
        Checklist source = checklistRepository.findWithDetailsByIdAndUser_Id(checklistId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("체크리스트를 찾을 수 없습니다."));

        Checklist copy = Checklist.builder()
                .user(userRepository.getReferenceById(userId))
                .title(copyTitle(source.getTitle()))
                .category(source.getCategory())
                .build();
        List<ChecklistItem> sourceItems = source.getItems().stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .toList();
        for (int i = 0; i < sourceItems.size(); i++) {
            copy.getItems().add(ChecklistItem.builder()
                    .checklist(copy)
                    .content(sourceItems.get(i).getContent())
                    .sortOrder(i)
                    .build());
        }
        checklistRepository.save(copy);
        return toResponse(copy);
    }

    // 접미사를 붙여도 제목 최대 길이를 넘지 않도록 원 제목을 잘라낸다.
    private String copyTitle(String title) {
        int maxBaseLength = TITLE_MAX_LENGTH - COPY_SUFFIX.length();
        if (title.length() <= maxBaseLength) {
            return title + COPY_SUFFIX;
        }
        int end = maxBaseLength;
        // 서로게이트 쌍이 잘리지 않게 한다.
        if (Character.isHighSurrogate(title.charAt(end - 1))) {
            end--;
        }
        return title.substring(0, end) + COPY_SUFFIX;
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
