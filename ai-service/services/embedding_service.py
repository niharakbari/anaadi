import os
import logging
import numpy as np
import torch
import torch.nn.functional as F
import open_clip
from PIL import Image
from config import Config

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Generates image embeddings using OpenCLIP.
    """

    def __init__(self):
        # Use GPU if available, otherwise CPU.
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        # Load model and preprocessing pipeline once.
        logger.info(f"Loading OpenCLIP model ({Config.MODEL_NAME}, {Config.PRETRAINED_WEIGHTS})...")
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            Config.MODEL_NAME,
            pretrained=Config.PRETRAINED_WEIGHTS,
            device=self.device
        )

        # Switch to inference mode.
        self.model.eval()
        logger.info("Model loaded and ready.")

    def generate_embedding(self, image_path: str) -> np.ndarray:
        """
        Generates a normalized embedding for an image.

        Args:
            image_path: Path to the image.

        Returns:
            A normalized 512-dimensional NumPy vector.
        """

        # Validate input path.
        if not image_path:
            raise ValueError("Image path is required.")

        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found at: {image_path}")

        # Load image as RGB.
        try:
            pil_image = Image.open(image_path).convert("RGB")
        except Exception as error:
            raise RuntimeError(f"Failed to load image: {error}") from error

        # Apply OpenCLIP preprocessing.
        image_tensor = self.preprocess(pil_image)

        # Create a batch and move to the selected device.
        image_batch = image_tensor.unsqueeze(0).to(self.device)

        # Generate image embedding.
        with torch.no_grad():
            embedding_tensor = self.model.encode_image(image_batch)

        # Normalize for cosine similarity search.
        embedding_normalised = F.normalize(embedding_tensor, p=2, dim=1)

        # Convert to a flat NumPy array.
        embedding_numpy = embedding_normalised.cpu().numpy().flatten()

        return embedding_numpy