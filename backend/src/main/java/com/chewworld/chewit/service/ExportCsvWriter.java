package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.ExportDtos.ExportCategory;
import com.chewworld.chewit.dto.ExportDtos.ExportChecklist;
import com.chewworld.chewit.dto.ExportDtos.ExportChecklistItem;
import com.chewworld.chewit.dto.ExportDtos.ExportDocument;
import com.chewworld.chewit.dto.ExportDtos.ExportEvent;
import com.chewworld.chewit.dto.ExportDtos.ExportOccurrenceOverride;
import com.chewworld.chewit.dto.ExportDtos.ExportRoutine;
import com.chewworld.chewit.dto.ExportDtos.ExportTask;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * ExportDocument를 'kind' 열이 있는 단일 CSV로 변환한다.
 * 모든 종류가 같은 열 집합을 공유하고(해당 없는 칸은 빈 값), 하위 행은 parent_id로 부모를 가리킨다.
 */
final class ExportCsvWriter {

    static final String BOM = "﻿";
    private static final String NEWLINE = "\r\n";
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    static final List<String> HEADER = List.of(
            "kind", "id", "parent_id", "title", "memo", "date", "category", "priority", "start_time",
            "done", "recurrence", "days_of_week", "color", "active", "skipped", "sort_order");

    private ExportCsvWriter() {
    }

    static String write(ExportDocument doc) {
        StringBuilder sb = new StringBuilder(BOM);
        appendRow(sb, HEADER);

        for (ExportCategory c : doc.categories()) {
            row(sb, "category", c.id(), null, c.name(), null, null, null, null, null, null, null, null, c.color(),
                    null, null, null);
        }
        for (ExportTask t : doc.tasks()) {
            row(sb, "task", t.id(), null, t.title(), t.memo(), t.date(), t.categoryName(), t.priority(),
                    t.startTime() == null ? null : TIME.format(t.startTime()), t.done(), null, null, null,
                    null, null, null);
        }
        for (ExportEvent e : doc.events()) {
            row(sb, "event", e.id(), null, e.title(), e.memo(), e.date(), e.categoryName(), null, null, null,
                    e.recurrence(), null, null, null, null, null);
            for (ExportOccurrenceOverride o : e.overrides()) {
                row(sb, "event_override", null, e.id(), o.title(), o.memo(), o.occurrenceDate(), null, null, null,
                        null, null, null, null, null, o.skipped(), null);
            }
        }
        for (ExportChecklist c : doc.checklists()) {
            row(sb, "checklist", c.id(), null, c.title(), null, null, c.categoryName(), null, null, null, null,
                    null, null, null, null, null);
            for (ExportChecklistItem i : c.items()) {
                row(sb, "checklist_item", i.id(), c.id(), i.content(), null, null, null, null, null, i.checked(),
                        null, null, null, null, null, i.sortOrder());
            }
        }
        for (ExportRoutine r : doc.routines()) {
            String days = r.daysOfWeek().stream().map(Enum::name).collect(Collectors.joining(";"));
            row(sb, "routine", r.id(), null, r.title(), r.memo(), null, null, null, null, null, null, days,
                    null, r.active(), null, null);
            for (LocalDate d : r.completions()) {
                row(sb, "routine_completion", null, r.id(), null, null, d, null, null, null, null, null, null,
                        null, null, null, null);
            }
        }
        return sb.toString();
    }

    // 인자 순서는 HEADER와 같다.
    private static void row(StringBuilder sb, Object... cells) {
        appendRow(sb, Arrays.stream(cells).map(c -> c == null ? "" : c.toString()).toList());
    }

    private static void appendRow(StringBuilder sb, List<String> cells) {
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(escape(cells.get(i)));
        }
        sb.append(NEWLINE);
    }

    /** CSV 수식 주입을 막고(위험 문자로 시작하면 ' 접두) RFC 4180 방식으로 따옴표 처리한다. */
    static String escape(String value) {
        if (value.isEmpty()) {
            return value;
        }
        String safe = value;
        char first = value.charAt(0);
        if (first == '=' || first == '+' || first == '-' || first == '@' || first == '\t' || first == '\r') {
            safe = "'" + value;
        }
        if (safe.indexOf(',') >= 0 || safe.indexOf('"') >= 0 || safe.indexOf('\n') >= 0 || safe.indexOf('\r') >= 0) {
            return '"' + safe.replace("\"", "\"\"") + '"';
        }
        return safe;
    }
}
