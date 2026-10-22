package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.ExportDtos.ExportDocument;
import com.chewworld.chewit.entity.Category;
import com.chewworld.chewit.entity.Checklist;
import com.chewworld.chewit.entity.ChecklistItem;
import com.chewworld.chewit.entity.Event;
import com.chewworld.chewit.entity.EventOccurrenceOverride;
import com.chewworld.chewit.entity.RecurrenceType;
import com.chewworld.chewit.entity.Routine;
import com.chewworld.chewit.entity.RoutineCompletion;
import com.chewworld.chewit.entity.Task;
import com.chewworld.chewit.entity.TaskPriority;
import com.chewworld.chewit.repository.CategoryRepository;
import com.chewworld.chewit.repository.ChecklistRepository;
import com.chewworld.chewit.repository.EventOccurrenceOverrideRepository;
import com.chewworld.chewit.repository.EventRepository;
import com.chewworld.chewit.repository.RoutineCompletionRepository;
import com.chewworld.chewit.repository.RoutineRepository;
import com.chewworld.chewit.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExportServiceImplTest {

    private static final Long USER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;

    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private EventOccurrenceOverrideRepository overrideRepository;
    @Mock
    private ChecklistRepository checklistRepository;
    @Mock
    private RoutineRepository routineRepository;
    @Mock
    private RoutineCompletionRepository routineCompletionRepository;

    @InjectMocks
    private ExportServiceImpl exportService;

    private final Category work = Category.builder().id(5L).name("업무").color("#3B82F6").build();

    private void stubSampleData() {
        when(categoryRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(work));
        when(taskRepository.findByUser_IdOrderByDateAscIdAsc(USER_ID)).thenReturn(List.of(
                Task.builder().id(10L).title("회의").memo("메모").date(LocalDate.of(2026, 10, 1))
                        .priority(TaskPriority.HIGH).startTime(LocalTime.of(9, 30)).done(true).category(work).build()));

        Event event = Event.builder().id(20L).title("스터디").date(LocalDate.of(2026, 10, 2))
                .recurrence(RecurrenceType.WEEKLY).build();
        when(eventRepository.findByUser_IdOrderByDateAsc(USER_ID)).thenReturn(List.of(event));
        when(overrideRepository.findByEvent_User_IdOrderByOccurrenceDateAsc(USER_ID)).thenReturn(List.of(
                EventOccurrenceOverride.builder().event(event).occurrenceDate(LocalDate.of(2026, 10, 9))
                        .skipped(true).build(),
                EventOccurrenceOverride.builder().event(event).occurrenceDate(LocalDate.of(2026, 10, 16))
                        .title("특강").memo("강당").build()));

        Checklist checklist = Checklist.builder().id(30L).title("장보기").category(work)
                .items(new ArrayList<>()).build();
        checklist.getItems().add(ChecklistItem.builder().id(32L).checklist(checklist).content("우유").sortOrder(1).build());
        checklist.getItems().add(ChecklistItem.builder().id(31L).checklist(checklist).content("계란")
                .checked(true).sortOrder(0).build());
        when(checklistRepository.findWithDetailsByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(checklist));

        Routine routine = Routine.builder().id(40L).title("운동")
                .daysOfWeek(new HashSet<>(Set.of(DayOfWeek.WEDNESDAY, DayOfWeek.MONDAY))).build();
        when(routineRepository.findWithDaysByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(routine));
        when(routineCompletionRepository.findByRoutine_IdInOrderByDateAsc(List.of(40L))).thenReturn(List.of(
                RoutineCompletion.builder().routine(routine).date(LocalDate.of(2026, 9, 28)).build(),
                RoutineCompletion.builder().routine(routine).date(LocalDate.of(2026, 9, 30)).build()));
    }

    @Test
    void exportData_모든_종류를_포함한다() {
        stubSampleData();

        ExportDocument doc = exportService.exportData(USER_ID);

        assertThat(doc.version()).isEqualTo(1);
        assertThat(doc.exportedAt()).isNotNull();
        assertThat(doc.categories()).extracting("name").containsExactly("업무");

        assertThat(doc.tasks()).hasSize(1);
        assertThat(doc.tasks().get(0).priority()).isEqualTo(TaskPriority.HIGH);
        assertThat(doc.tasks().get(0).startTime()).isEqualTo(LocalTime.of(9, 30));
        assertThat(doc.tasks().get(0).categoryId()).isEqualTo(5L);
        assertThat(doc.tasks().get(0).categoryName()).isEqualTo("업무");

        assertThat(doc.events()).hasSize(1);
        assertThat(doc.events().get(0).recurrence()).isEqualTo(RecurrenceType.WEEKLY);
        assertThat(doc.events().get(0).categoryId()).isNull();
        assertThat(doc.events().get(0).overrides()).hasSize(2);
        assertThat(doc.events().get(0).overrides().get(0).skipped()).isTrue();
        assertThat(doc.events().get(0).overrides().get(1).title()).isEqualTo("특강");

        assertThat(doc.checklists().get(0).items()).extracting("content").containsExactly("계란", "우유");

        assertThat(doc.routines().get(0).daysOfWeek()).containsExactly(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY);
        assertThat(doc.routines().get(0).completions())
                .containsExactly(LocalDate.of(2026, 9, 28), LocalDate.of(2026, 9, 30));
    }

    @Test
    void exportData_본인_userId로만_조회하고_타인_데이터는_포함하지_않는다() {
        org.mockito.Mockito.lenient().when(taskRepository.findByUser_IdOrderByDateAscIdAsc(OTHER_USER_ID)).thenReturn(List.of(
                Task.builder().id(99L).title("남의 할일").date(LocalDate.of(2026, 10, 1)).build()));

        ExportDocument doc = exportService.exportData(USER_ID);

        assertThat(doc.tasks()).isEmpty();
        verify(taskRepository).findByUser_IdOrderByDateAscIdAsc(USER_ID);
        verify(taskRepository, never()).findByUser_IdOrderByDateAscIdAsc(OTHER_USER_ID);
        verify(overrideRepository).findByEvent_User_IdOrderByOccurrenceDateAsc(USER_ID);
    }

    @Test
    void exportData_데이터가_없으면_빈_목록이고_루틴_완료기록을_조회하지_않는다() {
        ExportDocument doc = exportService.exportData(USER_ID);

        assertThat(doc.categories()).isEmpty();
        assertThat(doc.tasks()).isEmpty();
        assertThat(doc.events()).isEmpty();
        assertThat(doc.checklists()).isEmpty();
        assertThat(doc.routines()).isEmpty();
        verify(routineCompletionRepository, never()).findByRoutine_IdInOrderByDateAsc(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void exportCsv_BOM과_헤더로_시작하고_종류별_행을_만든다() {
        stubSampleData();

        String csv = exportService.exportCsv(USER_ID);

        assertThat(csv).startsWith("﻿kind,id,parent_id,title,memo,date,category,priority,start_time,"
                + "done,recurrence,days_of_week,color,active,skipped,sort_order\r\n");
        List<String> lines = List.of(csv.split("\r\n"));
        assertThat(lines).contains(
                "category,5,,업무,,,,,,,,,#3B82F6,,,",
                "task,10,,회의,메모,2026-10-01,업무,HIGH,09:30,true,,,,,,",
                "event,20,,스터디,,2026-10-02,,,,,WEEKLY,,,,,",
                "event_override,,20,,,2026-10-09,,,,,,,,,true,",
                "event_override,,20,특강,강당,2026-10-16,,,,,,,,,false,",
                "checklist,30,,장보기,,,업무,,,,,,,,,",
                "checklist_item,31,30,계란,,,,,,true,,,,,,0",
                "routine,40,,운동,,,,,,,,MONDAY;WEDNESDAY,,true,,",
                "routine_completion,,40,,,2026-09-28,,,,,,,,,,");
        assertThat(lines).hasSize(1 + 1 + 1 + 1 + 2 + 1 + 2 + 1 + 2);
    }

    @Test
    void exportCsv_빈_데이터는_BOM과_헤더만_반환한다() {
        String csv = exportService.exportCsv(USER_ID);

        assertThat(csv).startsWith("﻿kind,id,");
        assertThat(csv.split("\r\n")).hasSize(1);
    }

    @Test
    void exportCsv_쉼표_따옴표_개행을_이스케이프한다() {
        when(taskRepository.findByUser_IdOrderByDateAscIdAsc(USER_ID)).thenReturn(List.of(
                Task.builder().id(1L).title("a,b").memo("\"인용\"\n둘째 줄").date(LocalDate.of(2026, 10, 1)).build()));

        String csv = exportService.exportCsv(USER_ID);

        assertThat(csv).contains("task,1,,\"a,b\",\"\"\"인용\"\"\n둘째 줄\",2026-10-01,,,,false,,,,,,\r\n");
    }

    @Test
    void exportCsv_수식으로_시작하는_셀은_작은따옴표를_붙인다() {
        when(taskRepository.findByUser_IdOrderByDateAscIdAsc(USER_ID)).thenReturn(List.of(
                Task.builder().id(1L).title("=SUM(A1)").memo("@cmd").date(LocalDate.of(2026, 10, 1)).build(),
                Task.builder().id(2L).title("+1").memo("-1,5").date(LocalDate.of(2026, 10, 1)).build()));

        String csv = exportService.exportCsv(USER_ID);

        assertThat(csv).contains("task,1,,'=SUM(A1),'@cmd,");
        assertThat(csv).contains("task,2,,'+1,\"'-1,5\",");
    }
}
