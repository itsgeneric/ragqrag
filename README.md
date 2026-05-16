# RAGQRAG: Quantum-Enhanced Retrieval-Augmented Generation

Welcome to the repository for **RAGQRAG**, a research framework integrating Classical Retrieval-Augmented Generation (RAG) with Quantum Modules for advanced semantic search and evaluation.

## 🌐 Live Deployment
This project is fully deployed and securely hosted on **Microsoft Azure**. 
You can access the live application here: **[ragqrag.tech](https://ragqrag.tech)**

## 🏗️ Project Structure
The repository is designed as a unified workspace containing both the user interface and the core processing engine. 

* **`ragqrag-frontend/`**: The user-facing application. Built with Node.js, Vite, and TypeScript, this module handles query inputs, visualizes results, and provides the interactive dashboard for the framework.
* **`ragqrag-backend/`**: The computational engine. Built in Python, this module manages the classical RAG pipelines, interfaces with the quantum RAG components, and exposes the REST APIs consumed by the frontend.

## ⚙️ CI/CD & Automation
To maintain high availability and streamline development, this project utilizes automated **CI/CD (Continuous Integration / Continuous Deployment)** workflows. 

Code changes are automatically built, vetted, and pushed directly to the Azure infrastructure. This pipeline ensures that the live application at `ragqrag.tech` is reliably updated with the latest stable commits from the repository without requiring manual server interventions.