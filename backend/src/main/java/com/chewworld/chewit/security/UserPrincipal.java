package com.chewworld.chewit.security;

/**
 * 인증된 요청의 SecurityContext에 저장되는 최소 정보.
 * UserDetailsService 없이 JwtAuthenticationFilter가 직접 채워 넣는다.
 */
public record UserPrincipal(Long userId, String email) {
}
