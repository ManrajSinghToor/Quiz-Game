package com.quizarena.config;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.MapPropertySource;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DotenvInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        Map<String, Object> envProperties = new HashMap<>();

        File[] candidateFiles = new File[]{
                new File(".env"),
                new File("Backend/.env"),
                new File("../Backend/.env")
        };

        for (File envFile : candidateFiles) {
            if (envFile.exists() && envFile.isFile()) {
                try {
                    List<String> lines = Files.readAllLines(envFile.toPath());
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String value = line.substring(eqIdx + 1).trim();
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                    (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getenv(key) == null && System.getProperty(key) == null) {
                                envProperties.put(key, value);
                                System.setProperty(key, value);
                            }
                        }
                    }
                    System.out.println("[DotenvInitializer] Loaded environment variables from " + envFile.getAbsolutePath());
                    break;
                } catch (IOException e) {
                    System.err.println("[DotenvInitializer] Failed to read .env file: " + e.getMessage());
                }
            }
        }

        if (!envProperties.isEmpty()) {
            applicationContext.getEnvironment().getPropertySources()
                    .addFirst(new MapPropertySource("dotenvProperties", envProperties));
        }
    }
}

