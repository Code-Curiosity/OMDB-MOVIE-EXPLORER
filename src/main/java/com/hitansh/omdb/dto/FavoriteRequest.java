package com.hitansh.omdb.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

//Accepts either imdbID OR title (backend will resolve the other details).
@Data
@NoArgsConstructor
public class FavoriteRequest {
    //Give either imdbID or title (backend will resolve whichever is missing)
    private String imdbID;
    private String title;
}
