package com.hitansh.omdb.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Favorite {
    @Id
    private String imdbID;

    @Column(nullable= false)
    private String title;

    @Column(name = "release_year")
    @JsonProperty("year") // When serializing output use "year"
    @JsonAlias({"Year", "year"}) // Accept these names on input
    private String releaseYear;

    private String poster;

    private Instant addedAt = Instant.now();

}
