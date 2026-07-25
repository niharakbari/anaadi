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
---

# 16. Benchmark Progress (25 July 2026)

This section must document everything discovered after the first benchmark.

==================================================
1. Benchmark Identifier Bug (FIXED)
==================================================

The benchmark originally compared:

Database Primary Key (imageId)

against

Canonical Design Identifier embedded inside storedFilename.

Example:

Database ID:
947

Stored Filename:
design_1784956197652-5506130dcac828f3.JPG

Benchmark Expected:
1784956197652

The benchmark incorrectly reported Recall@1 = 0%.

The benchmark was corrected to compare the canonical design identifier extracted from storedFilename.

Engineering lesson: Ensure benchmark parsing matches the exact fields exported by the search pipeline. Comparing timestamps parsed via regex against database primary keys silently invalidates benchmark evaluations.

==================================================
2. Current Benchmark Results
==================================================

Semantic Only

Recall@1: 60%

Recall@5: 60%

MRR: 0.600

Average Rank: 4.60

Average Latency: ~9072 ms

Verified (Dense ViT Patch)

Recall@1: 20%

Recall@5: 40%

MRR: 0.269

Average Rank: 6.60

Average Latency: ~12974 ms

Document that verification currently DEGRADES retrieval performance.

==================================================
3. What Works Correctly
==================================================

SigLIP model loads correctly.
ONNX Runtime loads correctly.
Independent HNSW index loads correctly.
350 vectors loaded successfully.
Adaptive preprocessing executes correctly.
Dealer preprocessing only runs on search queries.
CAD indexing correctly skips preprocessing.
Benchmark identifier comparison is now correct.
Semantic retrieval successfully returns correct matches for several benchmark queries.

==================================================
4. Current Critical Problems
==================================================

Problem A

Dense ViT verification lowers Recall instead of improving it.

Expected:
Semantic candidates should be refined.

Actual:
Correct Rank-1 results are pushed down to Rank-5 or Rank-7.

Problem B

One benchmark query consistently returns:

Retrieved 100 vectors
Merged into 0
Returned Top 0

This is considered a critical bug.
The merge pipeline or candidate filtering must be audited.

Problem C

Verification latency increases total search time by approximately 3.9 seconds.
This exceeds the intended verification budget.

==================================================
5. Current Hypotheses
==================================================

Possible causes include:

- Incorrect feature serialization
- Patch ordering mismatch
- Feature extraction mismatch between query and indexed features
- Hybrid scoring weights unsuitable
- Verification scoring normalization bug
- Candidate merge logic bug
- FeatureManager returning incorrect features
- Spatial verification implementation error

These are hypotheses, not confirmed causes.

==================================================
6. Current Project Status
==================================================

Semantic retrieval:
Production quality.

Verification infrastructure:
Complete.

Verification AI:
Implemented but currently produces worse retrieval accuracy.

Benchmark infrastructure:
Working correctly.

Overall project:
NOT production ready until verification improves or is disabled.

==================================================
7. Next Engineering Tasks
==================================================

Highest priority:

- Investigate why Dense ViT Patch verification hurts Recall.
- Audit feature generation.
- Audit feature loading.
- Audit hybrid scoring.
- Audit verification ranking.
- Investigate "Merged into 0".
- Re-run benchmark after each fix.

Only enable verification once it demonstrates statistically significant improvement over the semantic baseline.
