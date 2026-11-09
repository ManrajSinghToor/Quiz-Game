package com.quizarena.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String[] locations = new String[]{
                "file:../Frontend/dist/",
                "file:Frontend/dist/",
                "file:./Frontend/dist/",
                "classpath:/static/"
        };

        registry.addResourceHandler("/**")
                .addResourceLocations(locations)
                .resourceChain(false);
    }
}

