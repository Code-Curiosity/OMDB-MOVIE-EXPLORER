package com.hitansh.omdb.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import jakarta.annotation.PostConstruct;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Service
public class OmdbService {
    private static final Logger log = LoggerFactory.getLogger(OmdbService.class);

    private final WebClient webClient;
    private final Cache<String, String> cache;
    private final ObjectMapper objectMapper;

    @Value("${omdb.api.key:}")
    private String apiKey;

    @PostConstruct
    public void init() {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("OMDB API key is NOT set (omdb.api.key is blank). Requests WILL fail with 401.");
        } else {
            apiKey = apiKey.trim();
            String masked = apiKey.length() > 4 ? "****" + apiKey.substring(apiKey.length() - 4) : "****";
            log.info("OMDB API key present (masked): {}", masked);
        }
    }

    // constructor now accepts ObjectMapper and assigns it
    public OmdbService(WebClient webClient, Cache<String, String> cache, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.cache = cache;
        this.objectMapper = objectMapper;
    }

    private String buildSearchKey(String s, int page, String type) {
        String t = (type == null) ? "" : type;
        return "search::" + s + "::" + page + "::" + t;
    }

    private String buildMovieKey(String id) {
        return "movie::" + id;
    }

    public Mono<String> search(String s, int page, String type) {
        if (apiKey == null || apiKey.isBlank()) {
            return Mono.error(new IllegalStateException("OMDB API key is not configured (omdb.api.key). Set OMDB_API_KEY env var."));
        }
        final String key = buildSearchKey(s, page, type);
        return Mono.fromCallable(() -> {
                    String cached = cache.getIfPresent(key);
                    if (cached != null) {
                        log.debug("Cache HIT for key={}", key);
                        return cached;
                    }
                    log.debug("Cache MISS for key={}", key);

                    String encodedS = URLEncoder.encode(s, StandardCharsets.UTF_8);
                    String uriPreview = String.format("/?s=%s&page=%d&type=%s&apikey=%s",
                            encodedS, page, (type == null ? "" : type),
                            apiKey == null ? "MISSING" : ("****" + (apiKey.length() > 4 ? apiKey.substring(apiKey.length() - 4) : apiKey)));
                    log.info("Calling OMDB: {}", uriPreview);

                    // perform blocking call on boundedElastic (we wrap in Mono.fromCallable so it's run off the Netty thread)
                    String result = webClient.get()
                            .uri(uriBuilder -> uriBuilder
                                    .queryParam("apikey", apiKey)
                                    .queryParam("s", s)
                                    .queryParam("page", Integer.toString(page))
                                    .queryParamIfPresent("type", java.util.Optional.ofNullable(type))
                                    .build())
                            .retrieve()
                            .bodyToMono(String.class)
                            .block();
                    if (result == null) result = "{\"Response\":\"False\",\"Error\":\"Empty response\"}";
                    cache.put(key, result);
                    return result;
                })
                .subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<String> getMovie(String id) {
        if (apiKey == null || apiKey.isBlank()) {
            return Mono.error(new IllegalStateException("OMDB API key is not configured (omdb.api.key). Set OMDB_API_KEY env var."));
        }
        final String key = buildMovieKey(id);
        return Mono.fromCallable(() -> {
                    String cached = cache.getIfPresent(key);
                    if (cached != null) {
                        log.debug("Cache HIT for key={}", key);
                        return cached;
                    }
                    log.debug("Cache MISS for key={}", key);

                    // LOG the outgoing request (masked API key)
                    String uriPreview = String.format("/?i=%s&plot=full&apikey=%s",
                            id, apiKey == null ? "MISSING" : ("****" + (apiKey.length() > 4 ? apiKey.substring(apiKey.length() - 4) : apiKey)));
                    log.info("Calling OMDB: {}", uriPreview);

                    String result = webClient.get()
                            .uri(uriBuilder -> uriBuilder
                                    .queryParam("apikey", apiKey)
                                    .queryParam("i", id)
                                    .queryParam("plot", "full")
                                    .build())
                            .retrieve()
                            .bodyToMono(String.class)
                            .block();
                    if (result == null) result = "{\"Response\":\"False\",\"Error\":\"Empty response\"}";
                    cache.put(key, result);
                    return result;
                })
                .subscribeOn(Schedulers.boundedElastic());
    }

    public Optional<String> findImdbIdByTitle(String title) {
        try {
            // reuse your search method (it already returns Mono<String>)
            String searchJson = search(title, 1, null).publishOn(Schedulers.boundedElastic()).block();
            if (searchJson == null) return Optional.empty();

            JsonNode root = objectMapper.readTree(searchJson);
            if (root.has("Search") && root.get("Search").isArray() && root.get("Search").size() > 0) {
                JsonNode first = root.get("Search").get(0);
                if (first.has("imdbID")) {
                    return Optional.of(first.get("imdbID").asText());
                }
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Failed to resolve imdbID for title '{}'", title, e);
            return Optional.empty();
        }
    }
}
