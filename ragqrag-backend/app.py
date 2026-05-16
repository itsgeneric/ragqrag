"""
RAG Knowledge Graph API
==============================================
Advanced RAG system with MongoDB vector search, Neo4j knowledge graph extraction,
and multi-LLM comparison with human feedback collection.
"""

# Core framework imports
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import uvicorn
from contextlib import asynccontextmanager

# Database and storage imports
from pymongo import MongoClient
from neo4j import GraphDatabase

# Machine learning and NLP imports
from sentence_transformers import SentenceTransformer
import nltk
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from nltk.tokenize import word_tokenize

# LLM API clients
from openai import OpenAI
from together import Together

# Utility and system imports
import uuid
import os
import re
import json
import atexit
from dotenv import load_dotenv

# Rich library for enhanced console output
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import print as rprint

# Initialize Rich console for enhanced terminal output
console = Console()

def print_status(message: str, status: str = "INFO", emoji: str = "") -> None:
    """
    Print formatted status messages to the console with color coding.

    This function provides a standardized way to display status messages throughout
    the application with appropriate color coding and formatting.

    Args:
        message (str): The message to display
        status (str): The status level (INFO, SUCCESS, WARNING, ERROR, PROCESSING)
        emoji (str): Optional emoji to display (falls back to predefined emojis)

    Returns:
        None
    """
    status_emojis = {
        "INFO": "",
        "SUCCESS": "",
        "WARNING": "",
        "ERROR": "",
        "PROCESSING": ""
    }

    status_colors = {
        "INFO": "blue",
        "SUCCESS": "green",
        "WARNING": "yellow",
        "ERROR": "red",
        "PROCESSING": "cyan"
    }

    display_emoji = status_emojis.get(status, emoji)
    color = status_colors.get(status, "blue")
    status_line = f"[{color}]{display_emoji} {status}:[/] {message}"
    console.print(status_line)

def print_startup_banner() -> None:
    """
    Display the application startup banner with formatted output.

    This function prints a visually appealing banner when the application starts,
    providing clear identification of the service being launched.

    Returns:
        None
    """
    console.print("[green]══════════════════════════════════════════════════════════════════════════[/green]")
    console.print("[bold cyan]RAG Knowledge Graph API[/bold cyan]")
    console.print("[green]══════════════════════════════════════════════════════════════════════════[/green]\n")

def initialize_nltk_safe() -> bool:
    """
    Initialize NLTK resources safely with error handling.

    Downloads required NLTK data packages (punkt and punkt_tab) needed for
    text tokenization in metric calculations. Handles failures gracefully
    to prevent application crashes.

    Returns:
        bool: True if NLTK initialization succeeded, False otherwise
    """
    try:
        print_status("Initializing NLTK resources", "PROCESSING")
        nltk.download('punkt', quiet=True)
        nltk.download('punkt_tab', quiet=True)
        print_status("NLTK resources initialized successfully", "SUCCESS")
        return True
    except Exception as e:
        print_status(f"NLTK initialization failed: {str(e)}", "WARNING")
        print("Continuing without NLTK tokenization...")
        return False

# Initialize NLTK resources and store availability status
nltk_available = initialize_nltk_safe()

# Environment Configuration
print_status("Loading environment variables", "PROCESSING")

# Remove SSL certificate file environment variable if present to avoid conflicts
os.environ.pop("SSL_CERT_FILE", None)
load_dotenv()

# Define required environment variables for application functionality
required_vars = ["MONGO_URI", "MONGO_DB", "MONGO_COLLECTION",
                "NEO4J_URI", "NEO4J_USERNAME", "NEO4J_PASSWORD", "TOGETHER_API_KEY"]

# Validate that all required environment variables are present
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    print_status(f"CRITICAL: Missing environment variables: {', '.join(missing_vars)}", "ERROR")
    print("\n📝 Create a .env file with these variables:")
    for var in required_vars:
        print(f"  {var}={os.getenv(var, 'YOUR_VALUE_HERE')}")
    exit(1)

print_status("Environment variables loaded successfully", "SUCCESS")

# Display application startup banner
print_startup_banner()

# Database Connection Initialization
print_status("Establishing database connections", "PROCESSING")

# MongoDB Atlas Connection Setup
try:
    mongo_uri = os.getenv("MONGO_URI")
    mongo_db_name = os.getenv("MONGO_DB")
    mongo_collection_name = os.getenv("MONGO_COLLECTION")

    # Establish connection to MongoDB Atlas
    mongo_client = MongoClient(mongo_uri)
    mongo_db = mongo_client[mongo_db_name]
    mongo_collection = mongo_db[mongo_collection_name]

    # Verify connection with ping command
    mongo_client.admin.command('ping')
    print_status("MongoDB connected successfully", "SUCCESS")
except Exception as e:
    print_status(f"MongoDB connection failed: {str(e)}", "ERROR")
    raise

# Neo4j Graph Database Connection Setup
try:
    neo4j_uri = os.getenv("NEO4J_URI")
    neo4j_user = os.getenv("NEO4J_USERNAME")
    neo4j_password = os.getenv("NEO4J_PASSWORD")

    # Establish connection to Neo4j database
    neo4j_driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))

    # Verify connection with simple query
    with neo4j_driver.session() as session:
        session.run("RETURN 1")
    print_status("Neo4j connected successfully", "SUCCESS")
except Exception as e:
    print_status(f"Neo4j connection failed: {str(e)}", "ERROR")
    raise

# Sentence Transformer Model Initialization
print_status("Loading embedding model", "PROCESSING")
try:
    # Load the all-MiniLM-L6-v2 model for text embeddings
    # This model provides good performance with relatively small size (22MB)
    LOCAL_EMBEDDING_MODEL = SentenceTransformer('all-MiniLM-L6-v2')
    print_status("Embedding model loaded successfully", "SUCCESS")
except Exception as e:
    print_status(f"Model loading failed: {str(e)}", "ERROR")
    raise

# Global Cache and Metrics Configuration
comparison_cache = {}  # In-memory cache for session data
METRICS_FILE = 'feedback_metrics.json'  # Persistent storage file for user feedback

# Pydantic Data Models for API Request/Response Validation
class QueryRequest(BaseModel):
    """
    Request model for document query operations.

    Attributes:
        query (str): The search query text
        k (int): Number of documents to retrieve (default: 10)
    """
    query: str
    k: int = 10

class ComparisonRequest(BaseModel):
    """
    Request model for generating LLM comparison responses.

    Attributes:
        session_id (str): Unique session identifier from previous query
    """
    session_id: str

class SingleFeedback(BaseModel):
    """
    Model for individual feedback entry on a specific LLM approach.

    Attributes:
        model_type (str): Type of model being rated (plain_llm, mongodb_rag, neo4j_kg_rag)
        ratings (Dict[str, int]): Dictionary of rating categories and scores (1-5 scale)
    """
    model_type: str
    ratings: Dict[str, int]

class FeedbackRequest(BaseModel):
    """
    Request model for submitting user feedback on LLM responses.

    Attributes:
        session_id (str): Unique session identifier from query
        feedbacks (List[SingleFeedback]): List of feedback entries for different models
    """
    session_id: str
    feedbacks: List[SingleFeedback]

    class Config:
        schema_extra = {
            "example": {
                "session_id": "123e4567-e89b-12d3-a456-426614174000",
                "model_type": "mongodb_rag",
                "ratings": {
                    "accuracy": 5,
                    "completeness": 4,
                    "coherence": 5,
                    "helpfulness": 4
                }
            }
        }

class CleanupRequest(BaseModel):
    """Request model for session cleanup operations."""
    session_id: str

class QueryResponse(BaseModel):
    """Response model for document query operations."""
    retrieved_docs: List[Dict[str, Any]]
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    session_id: str
    answer: str

class ComparisonResponse(BaseModel):
    """Response model for LLM comparison results."""
    plain_llm_answer: str
    mongodb_rag_answer: str
    neo4j_kg_rag_answer: str
    calculated_metrics: Dict[str, Dict[str, float]]

class FeedbackResponse(BaseModel):
    """Response model for feedback submission operations."""
    success: bool
    message: str

class HealthResponse(BaseModel):
    """Response model for health check operations."""
    status: str
    message: str

class DatabaseStatsResponse(BaseModel):
    """Response model for database statistics."""
    total_documents: int
    collection_name: str
    last_updated: str | None = None

# Utility Functions for Metrics and Data Management
def load_metrics():
    """
    Load existing feedback metrics from persistent storage.

    Attempts to load metrics data from the configured JSON file. If the file
    doesn't exist or is corrupted, returns an empty list to start fresh.

    Returns:
        list: List of previously saved metric entries, or empty list if none exist
    """
    if os.path.exists(METRICS_FILE):
        try:
            with open(METRICS_FILE, 'r') as f:
                data = json.load(f)
                print_status(f"Loaded {len(data)} metrics", "INFO")
                return data
        except:
            print_status("Starting fresh metrics", "WARNING")
            return []
    return []

def save_metrics(data):
    """
    Save feedback metrics to persistent storage.

    Writes the provided metrics data to a JSON file for persistence across
    application restarts. Handles write failures gracefully.

    Args:
        data (list): List of metric entries to save
    """
    try:
        with open(METRICS_FILE, 'w') as f:
            json.dump(data, f, indent=4)
        print_status(f"Saved {len(data)} metrics", "SUCCESS")
    except Exception as e:
        print_status(f"Metrics save failed: {str(e)}", "ERROR")

def validate_feedback_ratings(ratings: Dict[str, int]) -> bool:
    """
    Validate that feedback ratings contain the exact required keys.

    Checks if all required rating categories are present in the provided ratings.

    Args:
        ratings (Dict[str, int]): Dictionary of rating categories and scores

    Returns:
        bool: True if all required keys are present, False otherwise
    """
    required_keys = {"accuracy", "completeness", "coherence", "helpfulness"}
    received_keys = set(ratings.keys())
    return required_keys.issubset(received_keys)

# Automated Metrics Calculation Functions
def calculate_rouge_l_f1(candidate, reference):
    """
    Calculate ROUGE-L F1 score between candidate and reference texts.

    ROUGE-L measures the longest common subsequence (LCS) between two texts.
    This implementation uses token-level comparison for computational efficiency.

    Args:
        candidate (str): Generated text to evaluate
        reference (str): Ground truth reference text

    Returns:
        float: F1 score between 0.0 and 1.0 (rounded to 4 decimal places)
    """
    if not candidate or not reference:
        return 0.0
    try:
        if not nltk_available:
            return 0.0
        candidate_tokens = set(word_tokenize(candidate.lower()))
        reference_tokens = set(word_tokenize(reference.lower()))
        if not candidate_tokens or not reference_tokens:
            return 0.0
        intersect = len(candidate_tokens.intersection(reference_tokens))
        precision = intersect / len(candidate_tokens)
        recall = intersect / len(reference_tokens)
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        return round(f1_score, 4)
    except:
        return 0.0

def calculate_bleu(candidate, reference):
    """
    Calculate BLEU score between candidate and reference texts.

    BLEU (Bilingual Evaluation Understudy) measures n-gram overlap between
    generated and reference text. Uses smoothing to handle zero n-gram matches.

    Args:
        candidate (str): Generated text to evaluate
        reference (str): Ground truth reference text

    Returns:
        float: BLEU score between 0.0 and 1.0 (rounded to 4 decimal places)
    """
    if not candidate or not reference:
        return 0.0
    try:
        if not nltk_available:
            return 0.0
        candidate_tokens = word_tokenize(candidate.lower())
        reference_tokens = [word_tokenize(reference.lower())]
        if not candidate_tokens or not reference_tokens[0]:
            return 0.0
        chencherry = SmoothingFunction()
        return round(sentence_bleu(reference_tokens, candidate_tokens, smoothing_function=chencherry.method1), 4)
    except:
        return 0.0

def extract_json_from_string(s):
    """
    Extract and parse JSON content from a string that may contain additional text.

    This function handles LLM responses that may include JSON within explanatory
    text by trying multiple parsing strategies to extract valid JSON objects.

    Args:
        s (str): Input string potentially containing JSON

    Returns:
        dict or None: Parsed JSON object if extraction successful, None otherwise
    """
    try:
        if s.strip().startswith('{') and s.strip().endswith('}'):
            return json.loads(s.strip())
        match = re.search(r'{.*}', s, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(s.strip())
    except:
        return None

# Load existing metrics data at application startup
all_metrics = load_metrics()

# FastAPI Application Configuration and Lifecycle Management
app = FastAPI(
    title="RAG Knowledge Graph API",
    version="1.0.0",
    description="Advanced RAG system with MongoDB vector search and Neo4j knowledge graph extraction"
)

# CORS configuration to allow frontend (Vite dev server) to call this API
# Added support for FRONTEND_URL environment variable for Azure deployment
frontend_url = os.getenv("FRONTEND_URL", "https://ragqrag.tech")
allowed_origins = [
    "https://ragqrag.tech",
    "https://www.ragqrag.tech",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print_status("Starting RAG Knowledge Graph API", "SUCCESS")
    yield
    print_status("Shutting down API", "INFO")
    save_metrics(all_metrics)
    try:
        neo4j_driver.close()
        mongo_client.close()
    except:
        pass

app.router.lifespan_context = lifespan

# API Endpoint Definitions

@app.get("/", response_model=HealthResponse)
async def root():
    """
    Root endpoint providing basic API status and documentation link.

    Returns:
        HealthResponse: Basic service status and navigation information
    """
    print_status("Root endpoint accessed", "INFO")
    return HealthResponse(
        status="success",
        message="RAG Knowledge Graph API is running! Visit /docs"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint for service monitoring and load balancer probes.

    Returns:
        HealthResponse: Service health status with process ID
    """
    print_status("Health check", "INFO")
    return HealthResponse(
        status="healthy",
        message=f"API running (PID: {os.getpid()})"
    )

@app.get("/database/stats", response_model=DatabaseStatsResponse)
async def get_database_stats():
    """
    Get database statistics including total document count.

    Returns:
        DatabaseStatsResponse: Database statistics with document count and collection info
    """
    try:
        print_status("Fetching database statistics", "INFO")

        # Get total document count from MongoDB collection
        total_documents = mongo_collection.count_documents({})

        # Get collection name
        collection_name = mongo_collection_name

        print_status(f"Database stats: {total_documents} documents in {collection_name}", "SUCCESS")

        return DatabaseStatsResponse(
            total_documents=total_documents,
            collection_name=collection_name,
            last_updated=None  # Could add timestamp if needed
        )

    except Exception as e:
        print_status(f"Failed to fetch database statistics: {str(e)}", "ERROR")
        raise HTTPException(status_code=500, detail=f"Failed to fetch database statistics: {str(e)}")

@app.post("/query", response_model=QueryResponse)
async def query_endpoint(request: QueryRequest):
    """
    Primary query endpoint that performs vector search, knowledge graph extraction, and answer generation.

    This endpoint orchestrates the complete RAG pipeline:
    1. Generates embeddings for the input query
    2. Performs MongoDB vector search for relevant documents
    3. Extracts knowledge graph entities and relationships
    4. Generates MongoDB RAG answer using retrieved context
    5. Persists knowledge graph to Neo4j
    6. Calculates baseline metrics for evaluation

    Args:
        request (QueryRequest): Query request containing search text and parameters

    Returns:
        QueryResponse: Complete response with documents, graph data, and generated answer

    Raises:
        HTTPException: For empty queries, embedding failures, or search errors
    """
    print_status(f"Query: '{request.query}' (k={request.k})", "INFO")

    user_query = request.query.strip()
    k = request.k

    if not user_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # Generate query embedding using SentenceTransformer model
    try:
        print_status("Generating query embedding", "PROCESSING")
        query_vector = LOCAL_EMBEDDING_MODEL.encode(user_query, normalize_embeddings=True).tolist()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

    # MongoDB vector search
    pipeline = [
        {"$vectorSearch": {"index": "vector_index", "path": "embedding", "queryVector": query_vector,
                           "numCandidates": 100, "limit": k}},
        {"$project": {"_id": 1, "content": 1, "title": 1, "summary": 1, "keywords": 1, "url": 1,
                      "score": {"$meta": "vectorSearchScore"}}}
    ]

    try:
        print_status("MongoDB vector search", "PROCESSING")
        docs = list(mongo_collection.aggregate(pipeline))
        print_status(f"Retrieved {len(docs)} documents", "SUCCESS")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector search failed: {str(e)}")

    if not docs:
        session_id = str(uuid.uuid4())
        return QueryResponse(
            retrieved_docs=[],
            nodes=[],
            edges=[],
            session_id=session_id,
            answer="No relevant documents found."
        )

    # Format docs for frontend
    retrieved_docs_for_frontend = [{
        "id": str(doc.get("_id")),
        "score": f"{doc.get('score', 0):.4f}",
        "title": doc.get("title", "[No title]"),
        "summary": doc.get("summary", "[No summary]"),
        "keywords": ", ".join(doc.get("keywords", [])) if isinstance(doc.get("keywords"), list) else doc.get("keywords",
                                                                                                             ""),
        "url": doc.get("url", ""),
    } for doc in docs]

    # Prepare docs for KG extraction
    docs_text_parts = []
    for doc in docs:
        doc_id = str(doc["_id"])
        docs_text_parts.append(
            f"--- Document ID: {doc_id} ---\nTitle: {doc.get('title', '')}\nSummary: {doc.get('summary', '')}")

    docs_text = "\n\n".join(docs_text_parts)

    # Knowledge Graph Extraction
    print_status("Extracting knowledge graph", "PROCESSING")
    try:
        client = Together(api_key=os.getenv("TOGETHER_API_KEY"))
        prompt = f"""
        You are a powerful system that extracts a structured knowledge graph from a collection of documents.
        Each document is tagged with a 'Document ID'.
        
        **CRITICAL RULE: The 'source' entity MUST be the entity that PERFORMS the action ('relation') on the 'target' entity. Do not invert the relationship.**
        -   **Correct Example**: If the text is "IBM announced the development of Infoscope", the output MUST be:
            `{{'source': 'IBM', 'relation': 'DEVELOPED', 'target': 'Infoscope'}}`
        -   **Incorrect Example**: Do NOT output `{{'source': 'Infoscope', 'relation': 'DEVELOPED_BY', 'target': 'IBM'}}`. Always make the actor the source.
        
        Your task is to:
        1. Extract a list of named entities. For EACH entity, you MUST specify the ID of the document it came from.
        2. Extract a list of relationships between those entities.
        3. Return a maximum of 15 entities and 20 relationships in total. Focus on the most relevant and interconnected entities across the documents.
        4. Crucially, for every object in the "relationships" list, you MUST ensure that both the 'source' and 'target' entities are also defined in the "entities" list. Do not create relationships that refer to undefined entities.
        Output ONLY a single, valid JSON object with two keys: "entities" and "relationships".
    
        The "entities" list must contain objects with THREE keys:
        - "name": The name of the entity.
        - "type": The entity type (e.g., "Person", "Organization", "Technology").
        - "source_document_id": The ID of the document where this entity was found.
    
        Example output format:
        {{
          "entities": [
            {{ "name": "Alan Turing", "type": "Person", "source_document_id": "668808b86e..." }},
            {{ "name": "Enigma", "type": "Technology", "source_document_id": "668808b86e..." }},
            {{ "name": "IBM", "type": "Organization", "source_document_id": "668808b73c..." }}
          ],
          "relationships": [
            {{ "source": "Alan Turing", "relation": "cracked", "target": "Enigma" }}
          ]
        }}
        Relationships part of the JSON must contain entities from what you have defined in the "entities" list.
        Absolutely do not create relationships that refer to entities not defined in the "entities" list.
        It is fine if you do not find the required number of relationships, but if you do, ensure they are valid.
        Text to extract from:
        \"\"\"
        {docs_text}
        \"\"\"
        """

        response = client.chat.completions.create(
            model="Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=4000
        )
        parsed_output = extract_json_from_string(response.choices[0].message.content)

        if not parsed_output:
            parsed_output = {"entities": [], "relationships": []}

        print_status(f"KG: {len(parsed_output.get('entities', []))} entities", "SUCCESS")

    except Exception as e:
        print_status(f"KG extraction failed: {str(e)}", "WARNING")
        parsed_output = {"entities": [], "relationships": []}

    # MongoDB RAG Answer
    print_status("Generating RAG answer", "PROCESSING")
    try:
        context_text = "\n\n".join([
            f"Title: {doc.get('title', '[No title]')}\nSummary: {doc.get('summary', '[No summary]')}"
            for doc in docs
        ])
        answer_prompt = f""" You are a helpful assistant that answers user queries using the provided documents.
        Be concise and accurate. If the documents do not provide enough information to fully answer the query,
        you should clearly state what is known and mention that the current RAG system only contains 30,000 documents and cannot fully support your query.
        Query: {user_query}
        Documents:
        {context_text}
        Answer the query using the above documents. Your first 3-5 sentences should directly answer the query.
        Then, provide a paragraph long summary cum explanation of the most relevant documents used to answer the query.
        Do not exceed 150 words.
        Refer to the number and ID's of documents used in your answer. Be clear about this and show it explicitly at the end of your answer as references.
        Do not refer to the documents while providing the direct answer.
        """

        client2 = Together()
        response = client2.chat.completions.create(
            model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
            messages=[{"role": "user", "content": answer_prompt}],
            max_tokens=1000,
        )
        paragraph_answer = response.choices[0].message.content
    except Exception as e:
        paragraph_answer = f"[Answer generation failed: {str(e)}]"

    # Build Graph Structure
    print_status("Building graph structure", "PROCESSING")
    session_id = str(uuid.uuid4())
    nodes, edges = [], []
    unique_nodes = {}

    # Document nodes
    referenced_doc_ids = {ent.get("source_document_id") for ent in parsed_output.get("entities", [])}
    for doc_data in retrieved_docs_for_frontend:
        if doc_data['id'] in referenced_doc_ids:
            doc_node_id = f"doc_{doc_data['id']}"
            unique_nodes[doc_node_id] = {
                "id": doc_node_id,
                "label": f"Doc: {doc_data['id'][:8]}...",
                "group": "Document",
                "score": float(doc_data['score'])
            }

    # Entity nodes & relationships
    entity_map = {}
    all_entities_from_llm = parsed_output.get("entities", [])

    for ent in all_entities_from_llm:
        if not all(k in ent for k in ["name", "type", "source_document_id"]):
            continue
        safe_name = re.sub(r'[^a-zA-Z0-9]', '_', ent['name'])
        ent_id = f"{ent['type'].lower()}_{safe_name.lower()}"
        entity_map[ent['name']] = ent_id

        doc_id = ent["source_document_id"]
        doc_node_id = f"doc_{doc_id}"

        if ent_id not in unique_nodes:
            unique_nodes[ent_id] = {"id": ent_id, "label": ent["name"], "group": ent["type"]}

        if doc_node_id in unique_nodes:
            edges.append({"from": doc_node_id, "to": ent_id})

    # Handle relationships
    for rel in parsed_output.get("relationships", []):
        src_name = rel.get("source")
        tgt_name = rel.get("target")

        if not src_name or not tgt_name:
            continue

        for entity_name in [src_name, tgt_name]:
            if entity_name not in entity_map:
                safe_name = re.sub(r'[^a-zA-Z0-9_]', '_', entity_name)
                new_id = f"inferred_{safe_name.lower()}"
                if new_id not in unique_nodes:
                    unique_nodes[new_id] = {"id": new_id, "label": entity_name, "group": "Inferred"}
                entity_map[entity_name] = new_id

        src_id = entity_map.get(src_name)
        tgt_id = entity_map.get(tgt_name)
        if src_id and tgt_id:
            edges.append({
                "from": src_id,
                "to": tgt_id,
                "relation": rel.get("relation", "RELATED_TO")
            })

    nodes = list(unique_nodes.values())

    # Neo4j Persistence
    print_status("Persisting to Neo4j", "PROCESSING")
    try:
        with neo4j_driver.session() as session:
            for node_data in nodes:
                if node_data['group'] == 'Document':
                    session.run("""
                        MERGE (d:Document {id: $id})
                        ON CREATE SET d.title = $label, d.session = $sid
                    """, id=node_data['id'], label=node_data['label'], sid=session_id)
                else:
                    safe_label = re.sub(r'[^a-zA-Z0-9_]', '_', node_data['group'])
                    session.run(f"""
                        MERGE (e:{safe_label} {{id: $id}})
                        ON CREATE SET e.name = $label, e.session = $sid
                    """, id=node_data['id'], label=node_data['label'], sid=session_id)

            session.run("MERGE (c:Center {id: 'db'}) ON CREATE SET c.label = 'DB'")

            for node_data in nodes:
                if node_data["group"] == "Document":
                    session.run("""
                        MATCH (c:Center {id: 'db'}), (d:Document {id: $doc_id})
                        MERGE (c)-[:CONTAINS]->(d)
                    """, doc_id=node_data["id"])

            for edge_data in edges:
                if edge_data.get('relation'):
                    rel_type = re.sub(r'[^a-zA-Z0-9_]', '', edge_data['relation'].replace(" ", "_").upper())
                    if rel_type:
                        session.run(f"""
                            MATCH (a {{id: $src}}), (b {{id: $tgt}})
                            MERGE (a)-[r:{rel_type}]->(b)
                        """, src=edge_data['from'], tgt=edge_data['to'])

        print_status("Neo4j persistence successful", "SUCCESS")
    except Exception as e:
        print_status(f"Neo4j persistence failed: {str(e)}", "WARNING")

    print_status("Computing baseline metrics", "PROCESSING")

    # Generate Plain LLM answer for metrics comparison
    plain_llm_answer = "[Plain LLM not computed]"
    try:
        client_plain = Together()
        plain_response = client_plain.chat.completions.create(
            model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
            messages=[{"role": "user", "content": f"Answer: {user_query}"}],
            max_tokens=1000
        )
        plain_llm_answer = plain_response.choices[0].message.content
    except Exception as e:
        print_status(f"Plain LLM computation failed: {str(e)}", "WARNING")

    # Create reference text from documents
    reference_text = ". ".join([doc.get('summary', '') for doc in docs])

    # Calculate metrics for all 3 approaches
    calculated_metrics = {
        "plain_llm": {
            "bleu": calculate_bleu(plain_llm_answer, paragraph_answer),
            "rouge_l": calculate_rouge_l_f1(plain_llm_answer, paragraph_answer)
        },
        "mongodb_rag": {
            "bleu": calculate_bleu(paragraph_answer, reference_text),
            "rouge_l": calculate_rouge_l_f1(paragraph_answer, reference_text)
        },
        "neo4j_kg_rag": {
            "bleu": 0.0,  # Will be computed in /generate_comparison
            "rouge_l": 0.0  # Will be computed in /generate_comparison
        }
    }

    # Cache results WITH METRICS
    all_entity_names = list(entity_map.keys())
    comparison_cache[session_id] = {
        "query": user_query,
        "docs": docs,
        "mongodb_rag_answer": paragraph_answer,
        "plain_llm_answer": plain_llm_answer,
        "extracted_entities": all_entity_names,
        "document_info": retrieved_docs_for_frontend,
        "calculated_metrics": calculated_metrics,
        "reference_text": reference_text
    }

    print_status(f"Metrics computed and cached. Session: {session_id[:8]}", "SUCCESS")

    return QueryResponse(
        retrieved_docs=retrieved_docs_for_frontend,
        nodes=nodes,
        edges=edges,
        session_id=session_id,
        answer=paragraph_answer
    )

@app.post("/generate_comparison", response_model=ComparisonResponse)
async def generate_comparison_endpoint(request: ComparisonRequest):
    """
    Generate LLM comparison responses using three different approaches.

    This endpoint creates responses from three different RAG approaches:
    1. Plain LLM - Direct query without retrieval augmentation
    2. MongoDB RAG - Uses retrieved documents as context (cached from /query)
    3. Neo4j KG RAG - Uses knowledge graph relationships for enhanced context

    The endpoint also computes automated metrics (BLEU, ROUGE-L) comparing
    each approach against reference text derived from retrieved documents.

    Args:
        request (ComparisonRequest): Request containing session ID from previous query

    Returns:
        ComparisonResponse: Responses from all three approaches with calculated metrics

    Raises:
        HTTPException: If session ID is not found in cache
    """
    print_status(f"Comparison for session: {request.session_id}", "INFO")

    session_id = request.session_id
    if session_id not in comparison_cache:
        raise HTTPException(status_code=404, detail="Invalid session ID")

    cached_data = comparison_cache[session_id]
    user_query = cached_data["query"]

    # Generate Plain LLM Response (no retrieval augmentation)
    # Uses cached answer if available to avoid redundant API calls
    plain_llm_answer = cached_data.get("plain_llm_answer", "[No cached answer]")
    if plain_llm_answer == "[No cached answer]":
        try:
            # Generate response using only the query without any context
            client = Together()
            response = client.chat.completions.create(
                model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
                messages=[{"role": "user", "content": f"Answer: {user_query}"}],
                max_tokens=1000
            )
            plain_llm_answer = response.choices[0].message.content
            cached_data["plain_llm_answer"] = plain_llm_answer
        except Exception as e:
            plain_llm_answer = f"[Plain LLM failed: {str(e)}]"

    # Retrieve MongoDB RAG answer from cache (generated in /query endpoint)
    mongodb_rag_answer = cached_data.get("mongodb_rag_answer", "[No answer]")

    # Generate Neo4j Knowledge Graph RAG Response
    # Uses relationship data from Neo4j to provide context-aware answers
    neo4j_kg_rag_answer = "No entities extracted"
    try:
        entities = cached_data.get("extracted_entities", [])
        if entities:
            # Query Neo4j for relationships involving extracted entities
            with neo4j_driver.session() as session:
                results = session.run(
                    "UNWIND $entities AS e MATCH (n) WHERE n.name CONTAINS e MATCH (n)-[r]->(m) RETURN n.name AS s, type(r) AS rel, m.name AS t LIMIT 25",
                    entities=entities
                )
                # Format relationships as structured context
                kg_context = "\n".join([f"({r['s']})-[:{r['rel']}]->({r['t']})" for r in results])

            if kg_context:
                # Generate answer using knowledge graph relationships as context
                client = Together()
                response = client.chat.completions.create(
                    model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
                    messages=[{"role": "user", "content": f"Answer using KG: {user_query}\n{kg_context}"}],
                    max_tokens=1000
                )
                neo4j_kg_rag_answer = response.choices[0].message.content
            else:
                neo4j_kg_rag_answer = "No KG relationships found"
        else:
            neo4j_kg_rag_answer = "No entities extracted"
    except Exception as e:
        neo4j_kg_rag_answer = f"[KG RAG failed: {str(e)}]"
    # Calculate and update Neo4j KG RAG metrics against reference text
    reference_text = cached_data.get("reference_text", "")
    if reference_text:
        cached_data["calculated_metrics"]["neo4j_kg_rag"] = {
            "bleu": calculate_bleu(neo4j_kg_rag_answer, reference_text),
            "rouge_l": calculate_rouge_l_f1(neo4j_kg_rag_answer, reference_text)
        }

    # Retrieve final calculated metrics for all approaches
    metrics = cached_data.get("calculated_metrics", {})

    return ComparisonResponse(
        plain_llm_answer=plain_llm_answer,
        mongodb_rag_answer=mongodb_rag_answer,
        neo4j_kg_rag_answer=neo4j_kg_rag_answer,
        calculated_metrics=metrics
    )

@app.post("/human_feedback", response_model=FeedbackResponse)
async def save_feedback_endpoint(request: FeedbackRequest):
    """
    Save user feedback for LLM responses with validation and persistence.

    This endpoint processes user ratings for different RAG approaches and stores
    them alongside the automatically calculated metrics for research evaluation.
    Each feedback entry includes human ratings on accuracy, completeness,
    coherence, and helpfulness scales.

    Args:
        request (FeedbackRequest): Feedback data including session ID and ratings

    Returns:
        FeedbackResponse: Success status and count of saved entries

    Raises:
        HTTPException: If session is not found in cache
    """
    print_status(f"Saving {len(request.feedbacks)} feedback entries for session: {request.session_id}", "INFO")

    if request.session_id not in comparison_cache:
        raise HTTPException(status_code=404, detail="Session not found")

    cached_data = comparison_cache[request.session_id]
    saved_count = 0

    for fb in request.feedbacks:
        # Validate that all required rating categories are present
        required_keys = {"accuracy", "completeness", "coherence", "helpfulness"}
        if not required_keys.issubset(fb.ratings.keys()):
            print_status(f"Invalid ratings for {fb.model_type}: missing keys", "WARNING")
            continue

        # Create structured feedback entry combining human ratings with automated metrics
        feedback_entry = {
            "session_id": request.session_id,
            "query": cached_data.get("query"),
            "model_type": fb.model_type,
            "human_ratings": {
                "factual_accuracy": int(fb.ratings.get("accuracy", 0)),
                "completeness": int(fb.ratings.get("completeness", 0)),
                "coherence": int(fb.ratings.get("coherence", 0)),
                "helpfulness": int(fb.ratings.get("helpfulness", 0))
            },
            "calculated_metrics": cached_data.get("calculated_metrics", {}),
            "timestamp": str(uuid.uuid4())
        }

        # Add to global metrics collection for persistence
        global all_metrics
        all_metrics.append(feedback_entry)
        saved_count += 1

    save_metrics(all_metrics)
    print_status(f"Successfully saved {saved_count} feedback entries", "SUCCESS")
    return FeedbackResponse(success=True, message=f"Saved {saved_count} feedback entries")

@app.get("/save-metrics")
async def get_metrics():
    """
    Retrieve all collected feedback metrics for analysis and research.

    This endpoint returns the complete collection of user feedback and
    automatically calculated metrics across all sessions for research
    evaluation and model performance analysis.

    Returns:
        dict: Complete metrics collection with total count
    """
    print_status(f"Returning {len(all_metrics)} metrics", "INFO")
    return {"metrics": all_metrics, "total_entries": len(all_metrics)}

@app.delete("/cleanup/{session_id}")
async def cleanup_endpoint(session_id: str):
    """
    Clean up session-specific data from Neo4j and memory cache.

    This endpoint removes all Neo4j nodes and relationships associated with
    a specific session and clears the corresponding cache entry to free
    up system resources.

    Args:
        session_id (str): The session identifier to clean up

    Returns:
        dict: Confirmation message of cleanup completion

    Raises:
        HTTPException: If cleanup operations fail
    """
    print_status(f"Cleaning up session: {session_id}", "INFO")

    try:
        # Remove session-specific nodes and relationships from Neo4j
        with neo4j_driver.session() as session:
            result = session.run("MATCH (n {session: $sid}) DETACH DELETE n", sid=session_id)

        # Clear session data from in-memory cache
        if session_id in comparison_cache:
            del comparison_cache[session_id]

        print_status("Cleanup complete", "SUCCESS")
        return {"message": f"Cleanup complete for {session_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

# Application Shutdown and Cleanup Configuration
def cleanup_on_exit():
    """
    Perform cleanup operations when the application shuts down.

    Ensures that all collected metrics are persisted to disk before
    the application terminates to prevent data loss.
    """
    save_metrics(all_metrics)

# Register cleanup function to run on application exit
atexit.register(cleanup_on_exit)

if __name__ == "__main__":
    """
    Application entry point for direct execution.
    
    Starts the FastAPI server with Uvicorn on localhost:5001 with hot reload
    enabled for development. The server provides automatic API documentation
    at the /docs endpoint.
    """
    print_status("Starting FastAPI server", "SUCCESS")
    console.print("[bold green]Server ready at http://localhost:5001/docs[/bold green]\n")

    # Azure dynamically assigns a port via the PORT environment variable.
    port = int(os.getenv("PORT", 8000))
    is_dev = os.getenv("ENVIRONMENT") == "development"

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=is_dev,
        log_level="info"
    )
