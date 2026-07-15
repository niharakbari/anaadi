import os
import logging
import numpy as np
import faiss
from config import Config

logger = logging.getLogger(__name__)


class FAISSService:
    """
    Manages vector similarity searching using the FAISS library.
    
    Uses IndexFlatIP (Inner Product) wrapped in IndexIDMap.
    Since embeddings are L2 normalized, their inner product equals
    their Cosine Similarity, which satisfies the search requirements.
    """

    def __init__(self, dimension: int = 512):
        self.dimension = dimension
        self.index = None
        
        # Load the index from disk at startup
        self.load_index()

    def load_index(self):
        """
        Loads the FAISS index from the configured path if it exists.
        Otherwise, initializes a new IndexFlatIP wrapped in IndexIDMap.
        """
        path = Config.FAISS_INDEX_PATH
        if os.path.exists(path):
            logger.info(f"Loading existing index from {path}...")
            # faiss.read_index deserializes the saved IndexIDMap structure directly
            self.index = faiss.read_index(path)
            logger.info(f"Index loaded. Current total vectors: {self.index.ntotal}")
        else:
            logger.info(f"Index file not found at {path}. Initializing new index...")
            # IndexFlatIP uses Inner Product (IP).
            # When vectors are normalized, Inner Product equals Cosine Similarity.
            flat_index = faiss.IndexFlatIP(self.dimension)
            # IndexIDMap allows us to specify custom integer IDs (e.g., design_id)
            # instead of using sequential internal IDs (0, 1, 2, ...).
            self.index = faiss.IndexIDMap(flat_index)
            logger.info("New index initialized successfully.")

    def reset_index(self):
        """
        Resets the index to an empty state and saves it to disk.
        """
        logger.info("Resetting index to empty...")
        flat_index = faiss.IndexFlatIP(self.dimension)
        self.index = faiss.IndexIDMap(flat_index)
        self.save_index()

    def save_index(self):
        """
        Saves the current FAISS index to the configured path on disk.
        """
        path = Config.FAISS_INDEX_PATH
        # Ensure parent directories exist
        os.makedirs(os.path.dirname(path), exist_ok=True)
        logger.info(f"Saving index to {path}...")
        faiss.write_index(self.index, path)
        logger.info("Index saved successfully.")

    def add_embedding(self, design_id: int, embedding: np.ndarray):
        """
        Inserts a normalized embedding vector with a custom design ID into the index.
        Saves the index to disk immediately.
        """
        # Validate design_id is an integer
        if not isinstance(design_id, (int, np.integer)):
            raise ValueError("design_id must be an integer.")

        # Validate embedding type, shape and data type
        if not isinstance(embedding, np.ndarray) or embedding.dtype != np.float32:
            raise ValueError("Embedding must be a numpy float32 array.")

        if embedding.ndim != 1 or embedding.shape[0] != self.dimension:
            raise ValueError(f"Embedding must be a 1D array of size {self.dimension}.")

        # Validate embedding is normalized (L2 norm is approximately 1.0)
        norm = np.linalg.norm(embedding)
        if not np.isclose(norm, 1.0, atol=1e-3):
            raise ValueError(f"Embedding must be L2 normalized. Current norm: {norm:.4f}")

        # Reshape to a 2D matrix (1, dimension) for FAISS
        embedding_reshaped = embedding.reshape(1, -1)
        
        # Prepare IDs array
        ids = np.array([design_id], dtype=np.int64)

        # Add to the index
        self.index.add_with_ids(embedding_reshaped, ids)
        
        # Save the index to persist changes
        self.save_index()

    def search_similar(self, query_embedding: np.ndarray, top_k: int) -> list:
        """
        Finds the top_k most similar vectors in the index to the query vector.
        
        Returns:
            A list of dictionaries with matching design IDs and their similarity scores.
        """
        # Validate top_k
        if not isinstance(top_k, int) or top_k <= 0:
            raise ValueError("top_k must be a positive integer greater than 0.")

        # Validate query embedding type, shape and data type
        if not isinstance(query_embedding, np.ndarray) or query_embedding.dtype != np.float32:
            raise ValueError("Query embedding must be a numpy float32 array.")

        if query_embedding.ndim != 1 or query_embedding.shape[0] != self.dimension:
            raise ValueError(f"Query embedding must be a 1D array of size {self.dimension}.")

        # Validate query embedding is normalized
        norm = np.linalg.norm(query_embedding)
        if not np.isclose(norm, 1.0, atol=1e-3):
            raise ValueError(f"Query embedding must be L2 normalized. Current norm: {norm:.4f}")

        # If the index is empty, return an empty list immediately
        if self.index.ntotal == 0:
            return []

        # Reshape query embedding for FAISS
        query_reshaped = query_embedding.reshape(1, -1)

        # Query FAISS.
        # scores: 2D array of float similarity values
        # ids: 2D array of matched design IDs
        scores, ids = self.index.search(query_reshaped, top_k)

        # Format and return the results, filtering out empty slot placeholders (-1)
        results = []
        for score, design_id in zip(scores[0], ids[0]):
            if design_id != -1:
                results.append({
                    "design_id": int(design_id),
                    "score": round(float(score), 4)
                })

        return results

    def remove_embedding(self, design_id: int):
        """
        Deletes the embedding associated with the given design ID from the index.
        Saves the index to disk immediately.
        """
        if not isinstance(design_id, (int, np.integer)):
            raise ValueError("design_id must be an integer.")

        # Prepare ID for deletion
        ids = np.array([design_id], dtype=np.int64)

        # Remove from FAISS index
        self.index.remove_ids(ids)
        
        # Save the index to persist changes
        self.save_index()
