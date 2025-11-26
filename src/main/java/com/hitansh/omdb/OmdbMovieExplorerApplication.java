package com.hitansh.omdb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.PropertySource;

@SpringBootApplication
@PropertySource(value = "classpath:.env", ignoreResourceNotFound = true)
public class OmdbMovieExplorerApplication {

	public static void main(String[] args) {
		SpringApplication.run(OmdbMovieExplorerApplication.class, args);
	}

}
