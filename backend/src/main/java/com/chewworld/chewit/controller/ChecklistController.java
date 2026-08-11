package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.ChecklistDtos.ChecklistResponse;
import com.chewworld.chewit.dto.ChecklistDtos.CreateChecklistItemRequest;
import com.chewworld.chewit.dto.ChecklistDtos.CreateChecklistRequest;
import com.chewworld.chewit.dto.ChecklistDtos.ReorderItemsRequest;
import com.chewworld.chewit.dto.ChecklistDtos.UpdateChecklistItemRequest;
import com.chewworld.chewit.dto.ChecklistDtos.UpdateChecklistRequest;
import com.chewworld.chewit.security.UserPrincipal;
import com.chewworld.chewit.service.ChecklistService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/checklists")
@RequiredArgsConstructor
public class ChecklistController {

    private final ChecklistService checklistService;

    @GetMapping
    public List<ChecklistResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return checklistService.listAll(principal.userId());
    }

    @PostMapping
    public ChecklistResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateChecklistRequest request
    ) {
        return checklistService.create(principal.userId(), request);
    }

    @PatchMapping("/{id}")
    public ChecklistResponse rename(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateChecklistRequest request
    ) {
        return checklistService.rename(principal.userId(), id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        checklistService.delete(principal.userId(), id);
    }

    @PostMapping("/{id}/items")
    public ChecklistResponse addItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CreateChecklistItemRequest request
    ) {
        return checklistService.addItem(principal.userId(), id, request);
    }

    @PatchMapping("/{id}/items/{itemId}")
    public ChecklistResponse updateItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateChecklistItemRequest request
    ) {
        return checklistService.updateItem(principal.userId(), id, itemId, request);
    }

    @PatchMapping("/{id}/items/{itemId}/toggle")
    public ChecklistResponse toggleItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @PathVariable Long itemId
    ) {
        return checklistService.toggleItem(principal.userId(), id, itemId);
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public ChecklistResponse deleteItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @PathVariable Long itemId
    ) {
        return checklistService.deleteItem(principal.userId(), id, itemId);
    }

    @PatchMapping("/{id}/items/reorder")
    public ChecklistResponse reorderItems(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ReorderItemsRequest request
    ) {
        return checklistService.reorderItems(principal.userId(), id, request);
    }
}
