package com.hitansh.omdb.repository;

import com.hitansh.omdb.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<Favorite, String> {
}
