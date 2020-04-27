package fr.cnieg.cexi.gantt;

import fr.cnieg.cexi.gantt.exception.InternalServerError;
import fr.cnieg.cexi.gantt.exception.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api")
public class ApiController {

    private static final Logger LOGGER = LoggerFactory.getLogger(ApiController.class);

    @Value("${gantt.folder_data}")
    private String folderData;

    @RequestMapping(value = "/{name}", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    public String get(@PathVariable String name) {

        String path = folderData + File.separator + name + ".json";

        // Test file existence
        File file = new File(path);
        if(!file.exists()) {
            LOGGER.error("File doesnt exists : {}", path);
            throw new NotFoundException();
        }

        try {
            return new String(Files.readAllBytes(Paths.get(path)));
        } catch (IOException e) {
            LOGGER.error("Error while reading file {}", path, e);
            throw new InternalServerError();
        }
    }

    @RequestMapping(value = "/{name}", method = RequestMethod.POST, produces = MediaType.TEXT_PLAIN_VALUE)
    public void save(@PathVariable String name, @RequestBody String data) {

        LOGGER.debug("Saving {} with following data :\n{}", name, data);
        String path = folderData + File.separator + name + ".json";

        try {
            FileWriter writer = new FileWriter(path);
            writer.write(data);
            writer.close();
            LOGGER.info("Successfully saved to file : {}", path);
        } catch (IOException e) {
            LOGGER.error("Error while saving file : {}", path, e);
            throw new InternalServerError();
        }
    }


}
