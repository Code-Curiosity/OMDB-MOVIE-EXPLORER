package com.hitansh.omdb.controller;

import com.hitansh.omdb.dto.FavoriteRequest;
import com.hitansh.omdb.model.Favorite;
import com.hitansh.omdb.repository.FavoriteRepository;
import com.hitansh.omdb.service.OmdbService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.net.URI;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@Validated
public class OmdbController {

    private static final Logger log = LoggerFactory.getLogger(OmdbController.class);

    private final OmdbService omdbService;
    private final FavoriteRepository favoriteRepository;
    private final ObjectMapper objectMapper;

    // Note: constructor now accepts ObjectMapper (Spring will inject it via JacksonConfig or auto-config)
    public OmdbController(OmdbService omdbService,
                          FavoriteRepository favoriteRepository,
                          ObjectMapper objectMapper) {
        this.omdbService = omdbService;
        this.favoriteRepository = favoriteRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Search endpoint: /api/search?s=batman&page=1&type=movie
     */
    @GetMapping("/search")
    public Mono<ResponseEntity<String>> search(@RequestParam("s") String s,
                                               @RequestParam(value = "page", defaultValue = "1") int page,
                                               @RequestParam(value = "type", required = false) String type) {
        if (s == null || s.trim().isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body("{\"error\":\"Missing 's' query param\"}"));
        }
        return omdbService.search(s.trim(), page, type)
                .map(body -> ResponseEntity.ok().body(body))
                .onErrorResume(e -> {
                    log.error("Search error", e);
                    return Mono.just(ResponseEntity.status(502).body("{\"error\":\"Failed to fetch from OMDB\"}"));
                });
    }

    /**
     * Movie details: /api/movie/{id}
     */
    @GetMapping("/movie/{id}")
    public Mono<ResponseEntity<String>> movie(@PathVariable("id") String id) {
        return omdbService.getMovie(id)
                .map(body -> ResponseEntity.ok().body(body))
                .onErrorResume(e -> {
                    log.error("Movie fetch error", e);
                    return Mono.just(ResponseEntity.status(502).body("{\"error\":\"Failed to fetch from OMDB\"}"));
                });
    }

    /**
     * Favorites - list
     */
    @GetMapping("/favorites")
    public Flux<Favorite> listFavorites() {
        // repository is blocking — run on boundedElastic
        return Mono.fromCallable(() -> favoriteRepository.findAll())
                .flatMapMany(list -> Flux.fromIterable(list))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /**
     * Get single favorite by imdbID (recommended endpoint)
     */
    @GetMapping("/favorites/{id}")
    public Mono<ResponseEntity<Favorite>> getFavorite(@PathVariable("id") String id) {
        return Mono.fromCallable(() -> favoriteRepository.findById(id))
                .subscribeOn(Schedulers.boundedElastic())
                .map(opt -> opt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build()));
    }

    /**
     * Add favorite. Accepts FavoriteRequest { imdbID?, title? }.
     * Behavior:
     * - If imdbID is provided, fetch details from OMDb and populate missing fields.
     * - If only title is provided, find imdbID via search then fetch details.
     * - If favorite exists -> return existing (idempotent).
     * - On success of new save -> 201 Created with Location header.
     */
    @PostMapping("/favorites")
    public Mono<ResponseEntity<Favorite>> addFavorite(@RequestBody FavoriteRequest req) {
        if (req == null || ((req.getImdbID() == null || req.getImdbID().isBlank())
                && (req.getTitle() == null || req.getTitle().isBlank()))) {
            return Mono.just(ResponseEntity.badRequest().build());
        }

        return Mono.fromCallable(() -> {
                    // resolve imdbID or title
                    String imdbId = (req.getImdbID() != null && !req.getImdbID().isBlank())
                            ? req.getImdbID().trim()
                            : null;
                    String title = (req.getTitle() != null && !req.getTitle().isBlank())
                            ? req.getTitle().trim()
                            : null;

                    // If imdbId missing -> try to find it by title
                    if (imdbId == null) {
                        Optional<String> maybe = omdbService.findImdbIdByTitle(title);
                        if (maybe.isEmpty()) {
                            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Title not found in OMDb");
                        }
                        imdbId = maybe.get();
                    }

                    // If already exists, return existing (idempotent)
                    if (favoriteRepository.existsById(imdbId)) {
                        return favoriteRepository.findById(imdbId).orElseThrow();
                    }

                    // Fetch full details from OMDb
                    String movieJson = omdbService.getMovie(imdbId)
                            .publishOn(Schedulers.boundedElastic())
                            .block();

                    if (movieJson == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to fetch details from OMDb");
                    }

                    JsonNode root = objectMapper.readTree(movieJson);
                    if (root == null || !"True".equalsIgnoreCase(root.path("Response").asText("False"))) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "OMDb returned no data for id: " + imdbId);
                    }

                    String finalTitle = root.path("Title").asText(null);
                    String year = root.path("Year").asText(null);
                    String poster = root.path("Poster").asText(null);

                    if (finalTitle == null || finalTitle.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OMDb response missing Title for id: " + imdbId);
                    }

                    Favorite fav = new Favorite();
                    fav.setImdbID(imdbId);
                    fav.setTitle(finalTitle);
                    fav.setReleaseYear(year);
                    fav.setPoster(poster);

                    // save favorite (blocking repository call)
                    return favoriteRepository.save(fav);
                })
                .subscribeOn(Schedulers.boundedElastic())
                .map(saved -> {
                    // If save happened just now -> return 201 Created
                    URI location = URI.create("/api/favorites/" + saved.getImdbID());
                    return ResponseEntity.created(location).body(saved);
                })
                .onErrorResume(ex -> {
                    if (ex instanceof ResponseStatusException) {
                        ResponseStatusException rse = (ResponseStatusException) ex;
                        return Mono.just(ResponseEntity.status(rse.getStatusCode()).build());
                    }
                    log.error("Failed to save favorite", ex);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }

    /**
     * Delete favorite by imdbID
     */
    @DeleteMapping("/favorites/{id}")
    public Mono<ResponseEntity<Void>> deleteFavorite(@PathVariable("id") String id) {
        return Mono.fromRunnable(() -> {
                    if (favoriteRepository.existsById(id)) {
                        favoriteRepository.deleteById(id);
                    }
                })
                .subscribeOn(Schedulers.boundedElastic())
                .then(Mono.just(ResponseEntity.noContent().<Void>build()))
                .onErrorResume(e -> {
                    log.error("Failed to delete favorite", e);
                    return Mono.just(ResponseEntity.status(500).build());
                });
    }
}
