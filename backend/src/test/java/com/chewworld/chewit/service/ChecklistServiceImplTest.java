package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.ChecklistDtos.ChecklistResponse;
import com.chewworld.chewit.dto.ChecklistDtos.CreateChecklistItemRequest;
import com.chewworld.chewit.dto.ChecklistDtos.CreateChecklistRequest;
import com.chewworld.chewit.dto.ChecklistDtos.ReorderItemsRequest;
import com.chewworld.chewit.dto.ChecklistDtos.UpdateChecklistItemRequest;
import com.chewworld.chewit.dto.ChecklistDtos.UpdateChecklistRequest;
import com.chewworld.chewit.entity.Checklist;
import com.chewworld.chewit.entity.ChecklistItem;
import com.chewworld.chewit.entity.User;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.repository.ChecklistRepository;
import com.chewworld.chewit.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChecklistServiceImplTest {

    private static final Long USER_ID = 1L;
    private static final Long CHECKLIST_ID = 1L;

    @Mock
    private ChecklistRepository checklistRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ChecklistServiceImpl checklistService;

    private Checklist checklistWithItems(ChecklistItem... items) {
        Checklist checklist = Checklist.builder().id(CHECKLIST_ID).title("체크리스트").items(new ArrayList<>(List.of(items))).build();
        for (ChecklistItem item : items) {
            item.setChecklist(checklist);
        }
        return checklist;
    }

    @Test
    void create_체크리스트를_생성한다() {
        CreateChecklistRequest request = new CreateChecklistRequest("장보기");
        when(userRepository.getReferenceById(USER_ID)).thenReturn(User.builder().id(USER_ID).build());

        ChecklistResponse response = checklistService.create(USER_ID, request);

        assertThat(response.title()).isEqualTo("장보기");
        assertThat(response.items()).isEmpty();
    }

    @Test
    void rename_소유한_체크리스트면_제목을_변경한다() {
        Checklist checklist = checklistWithItems();
        when(checklistRepository.findByIdAndUser_Id(CHECKLIST_ID, USER_ID)).thenReturn(Optional.of(checklist));

        ChecklistResponse response = checklistService.rename(USER_ID, CHECKLIST_ID, new UpdateChecklistRequest("새 제목"));

        assertThat(response.title()).isEqualTo("새 제목");
    }

    @Test
    void delete_소유한_체크리스트를_삭제한다() {
        Checklist checklist = checklistWithItems();
        when(checklistRepository.findByIdAndUser_Id(CHECKLIST_ID, USER_ID)).thenReturn(Optional.of(checklist));

        checklistService.delete(USER_ID, CHECKLIST_ID);

        verify(checklistRepository).delete(checklist);
    }

    @Test
    void addItem_기존_항목_수만큼_sortOrder를_부여하고_flush한다() {
        ChecklistItem existing = ChecklistItem.builder().id(1L).content("우유").sortOrder(0).build();
        Checklist checklist = checklistWithItems(existing);
        when(checklistRepository.findByIdAndUser_Id(CHECKLIST_ID, USER_ID)).thenReturn(Optional.of(checklist));

        ChecklistResponse response = checklistService.addItem(USER_ID, CHECKLIST_ID, new CreateChecklistItemRequest("빵"));

        assertThat(response.items()).hasSize(2);
        assertThat(response.items().get(1).content()).isEqualTo("빵");
        assertThat(response.items().get(1).sortOrder()).isEqualTo(1);
        verify(checklistRepository).flush();
    }

    @Test
    void updateItem_존재하는_항목의_내용을_변경한다() {
        ChecklistItem item = ChecklistItem.builder().id(1L).content("우유").sortOrder(0).build();
        Checklist checklist = checklistWithItems(item);
        when(checklistRepository.findByIdAndUser_Id(CHECKLIST_ID, USER_ID)).thenReturn(Optional.of(checklist));

        ChecklistResponse response = checklistService.updateItem(USER_ID, CHECKLIST_ID, 1L, new UpdateChecklistItemRequest("두유"));

        assertThat(response.items().get(0).content()).isEqualTo("두유");
    }

    @Test
    void updateItem_존재하지_않는_항목이면_예외() {
        Checklist checklist = checklistWithItems();
        when(checklistRepository.findByIdAndUser_Id(CHECKLIST_ID, USER_ID)).thenReturn(Optional.of(checklist));

        assertThatThrownBy(() -> checklistService.updateItem(USER_ID, CHECKLIST_ID, 999L, new UpdateChecklistItemRequest("x")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void toggleItem_체크여부를_반전한다() {
        ChecklistItem item = ChecklistItem.builder().id(1L).content("우유").checked(false).sortOrder(0).build();
        Checklist checklist = checklistWithItems(item);
        when(checklistRepository.findByIdAndUser_Id(CHECKLIST_ID, USER_ID)).thenReturn(Optional.of(checklist));

        ChecklistResponse response = checklistService.toggleItem(USER_ID, CHECKLIST_ID, 1L);

        assertThat(response.items().get(0).checked()).isTrue();
    }

    @Test
    void deleteItem_목록에서_제거한다() {
        ChecklistItem item = ChecklistItem.builder().id(1L).content("우유").sortOrder(0).build();
        Checklist checklist = checklistWithItems(item);
        when(checklistRepository.findByIdAndUser_Id(CHECKLIST_ID, USER_ID)).thenReturn(Optional.of(checklist));

        ChecklistResponse response = checklistService.deleteItem(USER_ID, CHECKLIST_ID, 1L);

        assertThat(response.items()).isEmpty();
    }

    @Test
    void reorderItems_주어진_순서대로_sortOrder를_재부여한다() {
        ChecklistItem item1 = ChecklistItem.builder().id(1L).content("A").sortOrder(0).build();
        ChecklistItem item2 = ChecklistItem.builder().id(2L).content("B").sortOrder(1).build();
        Checklist checklist = checklistWithItems(item1, item2);
        when(checklistRepository.findByIdAndUser_Id(CHECKLIST_ID, USER_ID)).thenReturn(Optional.of(checklist));

        ChecklistResponse response = checklistService.reorderItems(USER_ID, CHECKLIST_ID, new ReorderItemsRequest(List.of(2L, 1L)));

        assertThat(response.items()).extracting("id").containsExactly(2L, 1L);
        assertThat(item1.getSortOrder()).isEqualTo(1);
        assertThat(item2.getSortOrder()).isEqualTo(0);
    }

    @Test
    void reorderItems_존재하지_않는_id가_포함되면_예외() {
        ChecklistItem item1 = ChecklistItem.builder().id(1L).content("A").sortOrder(0).build();
        Checklist checklist = checklistWithItems(item1);
        when(checklistRepository.findByIdAndUser_Id(CHECKLIST_ID, USER_ID)).thenReturn(Optional.of(checklist));

        assertThatThrownBy(() -> checklistService.reorderItems(USER_ID, CHECKLIST_ID, new ReorderItemsRequest(List.of(999L))))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void 소유하지_않은_체크리스트면_예외() {
        when(checklistRepository.findByIdAndUser_Id(CHECKLIST_ID, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> checklistService.rename(USER_ID, CHECKLIST_ID, new UpdateChecklistRequest("x")))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
