package com.chewworld.chewit.controller.support;

import com.chewworld.chewit.security.UserPrincipal;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

public final class ControllerTestSupport {

    private ControllerTestSupport() {
    }

    /**
     * addFilters=false라 Spring Security 필터 체인이 아예 실행되지 않으므로,
     * spring-security-test의 authentication() postprocessor(세션 저장 방식)는 동작하지 않는다.
     * MockMvc.perform()이 테스트와 같은 스레드에서 동기 실행되는 점을 이용해
     * SecurityContextHolder를 직접 채워 @AuthenticationPrincipal이 값을 받도록 한다.
     */
    public static RequestPostProcessor authenticatedAs(Long userId) {
        return request -> {
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(new UsernamePasswordAuthenticationToken(
                    new UserPrincipal(userId, "user" + userId + "@test.com"),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
            ));
            SecurityContextHolder.setContext(context);
            return request;
        };
    }
}
