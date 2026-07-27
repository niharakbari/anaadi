# Jewellery Image Search System

Github : https://github.com/niharakbari/anaadi

## Project Overview

This project is an internal jewellery image search system developed to help users find visually similar jewellery designs from an existing catalogue. Instead of searching manually, the user uploads a jewellery image and the system returns the closest matching designs.

---

# Objective

The objective of the project is to reduce the time required to search jewellery designs manually by using image similarity search.

---

# Overall Flow

1. User uploads a jewellery image through the frontend.
2. The backend receives the image and performs the required preprocessing.
3. OpenCLIP generates an embedding for the uploaded image.
4. The embedding is compared with the catalogue embeddings stored in the HNSW index.
5. The closest matching jewellery designs are identified.
6. The backend returns the matching results to the frontend.
7. The frontend displays the similar jewellery designs to the user.

---

# Development Flow

The project was implemented in the following order:

1. Backend project setup
2. Database connection
3. Authentication & Authorization
4. Request validation
5. Global error handling and logging
6. Image upload functionality
7. OpenCLIP integration
8. Embedding generation
9. HNSW indexing
10. Search API implementation
11. Frontend development
12. Backend–Frontend integration
13. Testing and improvements

---

# Technologies Used

### Backend

- Node.js
- Express.js
- MySQL

### Authentication

- JWT
- bcrypt

### Image Search

- OpenCLIP
- ONNX Runtime
- HNSW

### Frontend

- React
- Tailwind CSS

---

# Backend Request Flow

Every backend request follows this flow:

1. Client sends a request.
2. The request reaches the corresponding route.
3. Authentication middleware verifies the user (for protected APIs).
4. Request validation is performed.
5. The controller receives the validated request.
6. The service layer contains the business logic.
7. The model interacts with the MySQL database.
8. The response is returned to the client.

---

# Authentication Flow

- User logs in.
- Password is verified using bcrypt.
- Backend generates an Access Token and Refresh Token.
- Protected APIs verify the Access Token before processing requests.

---

# Image Import Flow

Catalogue images are imported into the system.

For each image:

- Generate an embedding using OpenCLIP.
- Store the embedding in the HNSW index.
- Save the image information in the database.

This process is performed once while importing catalogue images.

---

# Image Search Flow

- User uploads a jewellery image.
- OpenCLIP generates an embedding for the uploaded image.
- HNSW searches for the closest embeddings.
- The matching jewellery designs are fetched.
- Results are displayed on the frontend.

---

# Simple Explanation

### What is an Embedding?

An embedding is a numerical representation of an image. Instead of comparing images directly, the system compares these numerical vectors to find visually similar designs.

### Why HNSW?

Instead of comparing the uploaded image with every catalogue image one by one, HNSW quickly finds the closest matching embeddings, making the search much faster.

---

# Project Status

The project includes:

- User Authentication
- Secure APIs
- Image Import Pipeline
- OpenCLIP Integration
- Embedding Generation
- HNSW Vector Search
- Image Similarity Search APIs
- React Frontend
- Backend–Frontend Integration
- Testing and Refinements