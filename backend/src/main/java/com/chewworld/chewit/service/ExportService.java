package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.ExportDtos.ExportDocument;

public interface ExportService {

    /** 로그인한 사용자 본인의 모든 데이터를 하나의 문서로 만든다. */
    ExportDocument exportData(Long userId);

    /** exportData와 같은 내용을 UTF-8 BOM이 붙은 단일 CSV 문자열로 만든다. */
    String exportCsv(Long userId);
}
