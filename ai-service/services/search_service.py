import logging
from config import Config
from services.embedding_service import EmbeddingService
from services.faiss_service import FAISSService

logger = logging.getLogger(__name__)


class SearchService:
    def __init__(self):
        logger.info("Initializing SearchService...")
        self.embedding_service = EmbeddingService()
        # Pass the configured dimension so FAISSService and EmbeddingService
        # are always in agreement about vector size.
        self.faiss_service = FAISSService(dimension=Config.EMBEDDING_DIMENSION)
        logger.info("SearchService initialized successfully.")

    def perform_search(self, image_path=None, top_k=5) -> dict:
        logger.info(f"Received search request for image: {image_path} with top_k: {top_k}")
        try:
            embedding = self.embedding_service.generate_embedding(image_path)
            results = self.faiss_service.search_similar(embedding, top_k)
            logger.info(f"Search query completed successfully. Found {len(results)} matches.")
            return {
                "success": True,
                "results": results
            }
        except Exception as error:
            logger.error(f"Search request failed: {error}")
            return {
                "success": False,
                "message": str(error)
            }

    def delete_embedding(self, design_id: int) -> dict:
        logger.info(f"Request to delete embedding for design ID: {design_id}")
        try:
            self.faiss_service.remove_embedding(design_id)
            logger.info(f"Successfully deleted design ID {design_id} from FAISS index.")
            return {
                "success": True,
                "message": f"Successfully deleted design ID {design_id} from FAISS index."
            }
        except Exception as error:
            logger.error(f"Failed to delete design ID {design_id}: {error}")
            return {
                "success": False,
                "message": str(error)
            }
