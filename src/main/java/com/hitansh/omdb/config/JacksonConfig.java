package com.hitansh.omdb.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper om = new ObjectMapper();
        // register Java Time module so Instant / OffsetDateTime etc. serialize/deserialize nicely
        om.registerModule(new JavaTimeModule());
        // optional: avoid writing timestamps as arrays
        om.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // auto-discover other modules on classpath (e.g. Kotlin, JSR310)
        om.findAndRegisterModules();
        return om;
    }
}
