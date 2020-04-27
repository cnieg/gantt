package fr.cnieg.cexi.gantt;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.io.File;

@SpringBootApplication
public class GanttApplication {

	@Value("${gantt.folder_data}")
	private String folderData;

	public static void main(String[] args) {
		SpringApplication.run(GanttApplication.class, args);
	}

	@EventListener(ApplicationReadyEvent.class)
	public void init() {
		File file = new File(folderData);
		file.mkdirs();
	}
}
