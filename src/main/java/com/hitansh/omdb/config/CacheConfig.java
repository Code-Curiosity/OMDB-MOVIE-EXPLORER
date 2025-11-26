package com.hitansh.omdb.config;

import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

@Configuration
public class CacheConfig {

    /**
     * Creates a Caffeine cache bean that can be autowired as:
     *   Cache<String, String>
     *
     * Tune maximumSize and expireAfterWrite to your needs.
     */
    @Bean
    public Cache<String, String> caffeineCache() {
        return Caffeine.newBuilder()
                .maximumSize(10_000)                 // max entries in cache
                .expireAfterWrite(Duration.ofMinutes(30)) // TTL
                .recordStats()                       // optional: helpful for debugging
                .build();
    }
}
