const app = require("./app");
const { embeddingService, indexService } = require("./services/ai");

const config = require("./config/config");
const logger = require("./utils/logger");

async function bootstrap() {
    try {
        logger.info("Initializing AI services...");

        await embeddingService.initialise();
        await indexService.initialise();

        logger.info("AI services initialized successfully.");

        app.listen(config.port, () => {
            logger.info(`Server listening at http://localhost:${config.port}`);
        });
    } catch (error) {
        logger.error(`Failed to initialise AI services: ${error.stack || error.message || error}`);
        process.exit(1);
    }
}

bootstrap();
