package com.quizarena;

import com.quizarena.config.DotenvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class QuizArenaApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(QuizArenaApplication.class);
        application.addInitializers(new DotenvInitializer());
        application.run(args);
    }
}

