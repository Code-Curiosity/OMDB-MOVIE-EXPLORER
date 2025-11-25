package com.hitansh.omdb.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Cache;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class CacheConfig {
    
    @Bean
    public Caffeine<Object, Object> caffeineConfig(){
        return Caffeine.newBuilder()
                .expireAfterWrite(5,TimeUnit.MINUTES)
                .maximumSize(200);
    }

    @Bean
    public Cache<String, String> caffeineCache(Caffeine<Object, Object> caffeine){
        return caffeine.build();
    }
}
