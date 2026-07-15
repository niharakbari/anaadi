import os
import logging
from config import Config
from services.embedding_service import EmbeddingService
from services.faiss_service import FAISSService

logger = logging.getLogger(__name__)


class IndexBuilderService:
    """
    Scans the design library directory, generates embeddings for all design images,
    and indexes them inside the FAISS similarity index.
    """

    def __init__(self, embedding_service: EmbeddingService, faiss_service: FAISSService):
        self.embedding_service = embedding_service
        self.faiss_service = faiss_service

    def parse_design_id(self, filename: str) -> int:
        """
        Extracts the Design ID from the filename.
        Supported formats:
        - TIMESTAMP-hex.ext (e.g. 1783925506327-81fc3c13320076a7.jpg)
        - design_TIMESTAMP-hex.ext (e.g. design_1783925506327-81fc3c13320076a7.jpg)
        
        Returns:
            The design ID as an integer.
        
        Raises:
            ValueError: If the filename format is invalid and ID cannot be parsed.
        """
        # Get base name without the extension
        base_name, _ = os.path.splitext(filename)

        # Remove "design_" prefix if present
        if base_name.startswith("design_"):
            base_name = base_name[len("design_"):]

        # Split by hyphen and take the first portion
        parts = base_name.split("-")
        if not parts or not parts[0]:
            raise ValueError(f"No hyphen divider found in filename: {filename}")

        try:
            return int(parts[0])
        except ValueError as error:
            raise ValueError(f"Filename prefix is not an integer: {filename}") from error

    def rebuild_index(self):
        """
        Scans Config.DESIGN_LIBRARY_PATH, resets the FAISS index,
        and rebuilds it from scratch using current images.
        """
        library_path = Config.DESIGN_LIBRARY_PATH
        logger.info(f"Starting FAISS index rebuild scanning: {library_path}")

        if not os.path.exists(library_path):
            raise FileNotFoundError(f"Design library directory does not exist: {library_path}")

        # Step 1: Clear the current index
        self.faiss_service.reset_index()

        # Step 2: List files and filter by supported extensions
        supported_extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
        all_files = os.listdir(library_path)
        image_files = [
            f for f in all_files 
            if os.path.splitext(f.lower())[1] in supported_extensions
        ]

        total_files = len(image_files)
        logger.info(f"Found {total_files} candidate image files to process.")

        processed_ids = set()
        success_count = 0
        skip_count = 0

        # Step 3: Loop through each image, embed, and index
        for index, filename in enumerate(image_files, 1):
            filepath = os.path.join(library_path, filename)
            
            # Extract the design ID from the filename
            try:
                design_id = self.parse_design_id(filename)
            except ValueError as val_error:
                logger.warning(f"[SKIP] {filename} - {val_error}")
                skip_count += 1
                continue

            # Prevent duplicate Design IDs from being added to the index
            if design_id in processed_ids:
                logger.warning(f"[SKIP] {filename} - Duplicate Design ID: {design_id}")
                skip_count += 1
                continue

            # Generate embedding and add to FAISS index
            logger.info(f"[{index}/{total_files}] Processing design {design_id}: {filename}...")
            try:
                # Generate vector embedding using EmbeddingService (OpenCLIP)
                embedding = self.embedding_service.generate_embedding(filepath)
                
                # Add vector with design_id directly to FAISSService
                self.faiss_service.add_embedding(design_id, embedding)
                
                # Mark as processed
                processed_ids.add(design_id)
                success_count += 1
            except Exception as error:
                # Gracefully skip corrupted images/unsupported formats that fail to load
                logger.warning(f"[SKIP] {filename} - Failed to generate embedding: {error}")
                skip_count += 1

        logger.info(f"Rebuild complete. Success: {success_count}, Skipped: {skip_count}, Total indexed: {self.faiss_service.index.ntotal}")
