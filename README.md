# Anaadi

Anaadi is an image search tool built for jewellery designers. You upload a photo of a piece — taken from any angle, on or off the model — and the app finds visually similar designs from a reference library. The backend indexes each library image as a vector embedding and ranks results by visual similarity. Search queries are saved per user so designers can revisit past lookups and bookmark results they want to track.

## Tech Stack

- **Backend:** Node.js (Express 5), MySQL via `mysql2`, JWT authentication, HNSW vector index (`hnswlib-node`), image processing with `sharp` and `onnxruntime-node`
- **AI service:** Python (Flask), OpenCLIP (`ViT-B-32`) for embedding generation, FAISS for similarity search
- **Frontend:** React 19, Vite, Tailwind CSS, Radix UI, Framer Motion, React Router
- **Database:** MySQL

## Project Structure

```
anaadi/
├── backend/          Node.js API server (auth, image import, search, saved searches)
│   ├── src/          Application source — routes, controllers, services, models
│   └── .env.example  Environment variable reference
├── ai-service-python/ Flask microservice — embedding generation and FAISS search
├── frontend/         React client application
├── docs/             API reference, architecture overview, database schema, deployment guide
└── indexes/          HNSW index files (git-ignored, generated at runtime)
```

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in DB credentials, JWT secret, and upload paths in .env
npm run dev
```

The server starts on the port defined in `.env` (default `3200`).

### AI Service

```bash
cd ai-service-python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set FAISS_INDEX_PATH and DESIGN_LIBRARY_PATH
python app.py
```

The Flask service runs on port `5000` by default. The backend expects it to be reachable at the address configured in the backend `.env`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Documentation

The `docs/` folder contains the following reference documents:

- [API.md](docs/API.md) — REST endpoint reference for all routes
- [Architecture.md](docs/Architecture.md) — System design and service interaction overview
- [Database.md](docs/Database.md) — MySQL schema and table descriptions
- [Deployment.md](docs/Deployment.md) — Production deployment instructions
