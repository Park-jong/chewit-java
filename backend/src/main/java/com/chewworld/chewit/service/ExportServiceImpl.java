package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.ExportDtos;
import com.chewworld.chewit.dto.ExportDtos.ExportCategory;
import com.chewworld.chewit.dto.ExportDtos.ExportChecklist;
import com.chewworld.chewit.dto.ExportDtos.ExportChecklistItem;
import com.chewworld.chewit.dto.ExportDtos.ExportDocument;
import com.chewworld.chewit.dto.ExportDtos.ExportEvent;
import com.chewworld.chewit.dto.ExportDtos.ExportOccurrenceOverride;
import com.chewworld.chewit.dto.ExportDtos.ExportRoutine;
import com.chewworld.chewit.dto.ExportDtos.ExportTask;
import com.chewworld.chewit.entity.Category;
import com.chewworld.chewit.entity.ChecklistItem;
import com.chewworld.chewit.entity.Routine;
import com.chewworld.chewit.entity.RoutineCompletion;
import com.chewworld.chewit.repository.CategoryRepository;
import com.chewworld.chewit.repository.ChecklistRepository;
import com.chewworld.chewit.repository.EventOccurrenceOverrideRepository;
import com.chewworld.chewit.repository.EventRepository;
import com.chewworld.chewit.repository.RoutineCompletionRepository;
import com.chewworld.chewit.repository.RoutineRepository;
import com.chewworld.chewit.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** 종류별로 한 번씩 일괄 조회(루틴 없으면 6개, 있으면 7개 쿼리)해 N+1 없이 문서를 만든다. 모든 쿼리는 userId로 제한된다. */
@Service
@RequiredArgsConstructor
public class ExportServiceImpl implements ExportService {

    private final CategoryRepository categoryRepository;
    private final TaskRepository taskRepository;
    private final EventRepository eventRepository;
    private final EventOccurrenceOverrideRepository overrideRepository;
    private final ChecklistRepository checklistRepository;
    private final RoutineRepository routineRepository;
    private final RoutineCompletionRepository routineCompletionRepository;

    @Override
    @Transactional(readOnly = true)
    public ExportDocument exportData(Long userId) {
        return new ExportDocument(
                ExportDtos.EXPORT_VERSION,
                Instant.now(),
                categories(userId),
                tasks(userId),
                events(userId),
                checklists(userId),
                routines(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public String exportCsv(Long userId) {
        return ExportCsvWriter.write(exportData(userId));
    }

    private List<ExportCategory> categories(Long userId) {
        return categoryRepository.findByUser_IdOrderByCreatedAtAsc(userId).stream()
                .map(c -> new ExportCategory(c.getId(), c.getName(), c.getColor(), c.getCreatedAt()))
                .toList();
    }

    private List<ExportTask> tasks(Long userId) {
        return taskRepository.findByUser_IdOrderByDateAscIdAsc(userId).stream()
                .map(t -> new ExportTask(t.getId(), t.getTitle(), t.getMemo(), t.getDate(), t.isDone(),
                        t.getPriority(), t.getStartTime(), categoryId(t.getCategory()), categoryName(t.getCategory()),
                        t.getCreatedAt()))
                .toList();
    }

    // 시리즈 정의와 회차 override를 내보낸다. 펼친 회차는 규칙(date+recurrence)에서 다시 계산할 수 있으므로 제외.
    private List<ExportEvent> events(Long userId) {
        Map<Long, List<ExportOccurrenceOverride>> overridesByEvent = new HashMap<>();
        overrideRepository.findByEvent_User_IdOrderByOccurrenceDateAsc(userId).forEach(o ->
                overridesByEvent.computeIfAbsent(o.getEvent().getId(), k -> new ArrayList<>())
                        .add(new ExportOccurrenceOverride(o.getOccurrenceDate(), o.isSkipped(), o.getTitle(), o.getMemo())));

        return eventRepository.findByUser_IdOrderByDateAsc(userId).stream()
                .map(e -> new ExportEvent(e.getId(), e.getTitle(), e.getMemo(), e.getDate(), e.getRecurrence(),
                        categoryId(e.getCategory()), categoryName(e.getCategory()), e.getCreatedAt(),
                        overridesByEvent.getOrDefault(e.getId(), List.of())))
                .toList();
    }

    private List<ExportChecklist> checklists(Long userId) {
        return checklistRepository.findWithDetailsByUser_IdOrderByCreatedAtAsc(userId).stream()
                .map(c -> new ExportChecklist(c.getId(), c.getTitle(), categoryId(c.getCategory()),
                        categoryName(c.getCategory()), c.getCreatedAt(),
                        c.getItems().stream()
                                .sorted(Comparator.comparingInt(ChecklistItem::getSortOrder))
                                .map(i -> new ExportChecklistItem(i.getId(), i.getContent(), i.isChecked(), i.getSortOrder()))
                                .toList()))
                .toList();
    }

    private List<ExportRoutine> routines(Long userId) {
        List<Routine> routines = routineRepository.findWithDaysByUser_IdOrderByCreatedAtAsc(userId);
        if (routines.isEmpty()) {
            return List.of();
        }
        List<Long> ids = routines.stream().map(Routine::getId).toList();
        Map<Long, List<LocalDate>> completions = routineCompletionRepository
                .findByRoutine_IdInOrderByDateAsc(ids).stream()
                .collect(Collectors.groupingBy(c -> c.getRoutine().getId(),
                        Collectors.mapping(RoutineCompletion::getDate, Collectors.toList())));

        return routines.stream()
                .map(r -> new ExportRoutine(r.getId(), r.getTitle(), r.getMemo(),
                        r.getDaysOfWeek().stream().sorted().toList(), r.isActive(), r.getCreatedAt(),
                        completions.getOrDefault(r.getId(), List.of())))
                .toList();
    }

    private static Long categoryId(Category category) {
        return category == null ? null : category.getId();
    }

    private static String categoryName(Category category) {
        return category == null ? null : category.getName();
    }
}
