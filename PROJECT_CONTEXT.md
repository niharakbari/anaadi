# Anaadi – AI Jewellery Image Search System

## Project Overview

Anaadi is an AI-powered jewellery image retrieval system developed for jewellery manufacturers.

It is NOT an e-commerce application.

The software is intended for use by the production department to identify jewellery designs from dealer-uploaded images.

The primary workflow is:

Dealer uploads a mobile photo of jewellery

↓

AI generates an embedding

↓

HNSW searches visually similar designs

↓

Production team receives matching catalogue designs.

---

# Technology Stack

## Frontend

- React (Vite)
- Tailwind CSS
- Framer Motion

## Backend

- Node.js
- Express.js

## Database

- MySQL

## Authentication

- JWT
- bcrypt
- HTTP-only Cookies

## AI

- ONNX Runtime
- HNSWLib
- Sharp

---

# Current AI Architecture

The AI layer is completely modular.

It supports multiple embedding models through a common adapter interface.

Current architecture:

EmbeddingService
↓

AI Factory
↓

Selected Adapter
↓

Embedding Generation
↓

IndexService
↓

SearchService

Current model:

OpenCLIP ViT-B/32

Future models:

- DINOv2
- SigLIP
- EVA-CLIP
- Future fine-tuned jewellery models

The active model is selected through configuration.

Example:

AI_MODEL=openclip

Future:

AI_MODEL=dinov2

Changing the configuration and restarting the backend switches the entire AI pipeline.

---

# AI Folder Structure

backend/

ai-models/

BaseAIAdapter.js

openclip/

adapter.js

manifest.js

preprocess.js

visual.onnx

Future:

dinov2/

siglip/

...

Every model owns:

- adapter
- manifest
- preprocessing
- ONNX model

---

# AI Components

## BaseAIAdapter

Defines the contract every model must implement.

Required methods:

- initialize()
- embed(imageBuffer)
- getContext()
- shutdown() (optional)

---

## EmbeddingService

Acts as the Factory.

Responsibilities:

- Reads configured AI model.
- Loads correct adapter.
- Delegates embedding generation.
- Exposes AI Context.

No model-specific logic exists outside adapters.

---

## AI Context

Every adapter exposes one context object.

Contains:

- model id
- model name
- variant
- version
- embedding dimension
- search threshold
- distance metric
- preprocessing settings
- index path
- metadata path

Services consume only this context.

---

## Manifest

Each model has a manifest.

The manifest is the single source of truth for:

- model identity
- embedding dimension
- thresholds
- preprocessing
- model paths
- index paths

---

## IndexService

Responsibilities:

- Load HNSW index
- Save HNSW index
- Register new images
- Delete images
- Validate metadata
- Search vectors

Completely model-independent.

Uses AI Context.

---

## SearchService

Responsibilities:

- Generate query embedding
- Search HNSW
- Merge duplicate multi-view results
- Apply threshold
- Return final ranked designs

No model-specific logic.

---

# Multi-view Indexing

Every CAD sheet may contain multiple jewellery views.

Instead of embedding the entire sheet:

CAD Sheet

↓

Detect individual jewellery views

↓

Generate one embedding per view

↓

Store multiple vectors

↓

Search all vectors

↓

Merge duplicate design results

↓

Return only one result per design.

This improves retrieval without changing the AI model.

The crop generation is performed in memory.

Temporary images are only written in DEBUG mode.

---

# HNSW Storage

Every model owns an independent index.

Example:

indexes/

openclip/

jewellery.hnsw

metadata.json

Future:

indexes/

dinov2/

jewellery.hnsw

metadata.json

Different models NEVER share indexes.

---

# Database

Main tables:

users

design_images

saved_designs

search_history

search_history_results

Foreign keys are enabled.

Bulk delete respects dependency order.

---

# Current Features

Authentication

- Login
- Logout
- JWT
- Protected Routes

Catalogue

- Upload
- Delete
- Delete All
- Pagination
- Preview
- Download

Search

- Upload query
- Preview
- Top-K retrieval
- Similarity score
- Download

Saved Searches

- Save designs
- Dealer name
- Notes
- Preview
- Delete

Search History

- History
- Preview
- Delete
- Clear

Dashboard

- Uses live database statistics.

---

# Current Research Problem

The current challenge is NOT software.

The current challenge is AI retrieval quality.

Database images:

CAD / rendered jewellery.

Query images:

Dealer mobile photographs.

This creates a cross-domain retrieval problem:

Dealer Photo

↓

CAD Render

instead of

Photo

↓

Photo

The objective is to reduce this domain gap.

---

# Evaluation Strategy

Queries are manually categorized.

Category A

Exact or near-exact match exists.

Category B

Exact match missing.

Similar designs exist.

Category C

Design probably absent from dataset.

The benchmark is stored as JSON.

New embedding models are evaluated against this benchmark.

Current baseline:

OpenCLIP.

Future comparisons:

OpenCLIP vs DINOv2.

---

# AI Architecture Goals

The application should support multiple embedding models without changing:

- frontend
- backend APIs
- database
- business logic

Only:

AI_MODEL

changes.

Everything else remains identical.

---

# Development Rules

- Never hardcode model-specific logic outside adapters.
- Never mix embeddings from different models.
- Every model has its own adapter.
- Every model has its own manifest.
- Every model has its own preprocessing.
- Every model has its own HNSW index.
- Configuration is centralized in the config layer.
- Only the configuration layer accesses environment variables.
- Services never access process.env directly.

---

# Current Status

Completed:

- Production backend
- AI architecture
- Multi-view indexing
- Model abstraction
- Adapter system
- Factory pattern
- AI Context
- Manifest system
- Model-specific indexes

Next milestone:

Implement DINOv2 as the second AI model.

Compare:

OpenCLIP

vs

DINOv2

using the benchmark dataset.

The better-performing model becomes the default production model.

---

# Long-term Vision

Anaadi should evolve into a modular AI retrieval platform.

Future enhancements may include:

- Multiple embedding models
- Re-ranking
- Geometry-aware matching
- Better preprocessing
- Jewellery-specific fine-tuned models
- Benchmark-driven model evaluation

The architecture should allow experimentation without modifying the rest of the application.