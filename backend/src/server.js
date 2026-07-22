const fs = require("fs");
const path = require("path");
const app = require("./app");
const { embeddingService, indexService } = require("./services/ai");

const config = require("./config/config");
const logger = require("./utils/logger");

async function bootstrap() {
    try {
        // Ensure upload directories exist on startup
        const uploadDirs = [
            path.resolve(config.upload.designLibraryDirectory),
            path.resolve(config.upload.queryUploadDirectory)
        ];

        for (const dir of uploadDirs) {
            if (!fs.existsSync(dir)) {
                logger.info(`Creating missing upload directory: ${dir}`);
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        logger.info("Initializing AI services...");

        await embeddingService.initialise();
        await indexService.initialise();

        const aiContext = embeddingService.getContext();
        const vectorCount = indexService._index ? indexService._index.getCurrentCount() : 0;

        logger.info(`
==========================================
AI ENGINE
==========================================
Active Model          ${aiContext.id}
Model Name            ${aiContext.name}
Variant               ${aiContext.variant}
Version               ${aiContext.version}
Embedding Dimension   ${aiContext.dimension}
Distance Metric       ${aiContext.search.metric}
Search Threshold      ${aiContext.search.threshold}
Index Path            ${aiContext.paths.index}
Metadata Path         ${aiContext.paths.metadata}
Loaded Vector Count   ${vectorCount}
==========================================`);

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
