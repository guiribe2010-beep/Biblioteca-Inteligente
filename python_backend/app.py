"""
Biblioteca Inteligente - Referência de Configuração Backend em Python (FastAPI + SQLite + Gemini)
Este arquivo serve como guia estruturado para rodar o backend em Python localmente,
espelhando as rotas e regras de segurança usadas na aplicação web em execução.
"""

import os
import sqlite3
import uuid
from contextlib import contextmanager
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel, Field

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DB_PATH = os.getenv("DATABASE_PATH", "biblioteca.db")

app = FastAPI(title="Biblioteca Inteligente API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS books (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                isbn TEXT DEFAULT '',
                category TEXT NOT NULL DEFAULT 'quero_ler',
                genre TEXT DEFAULT 'Literatura',
                year INTEGER,
                total_pages INTEGER NOT NULL DEFAULT 200,
                current_page INTEGER NOT NULL DEFAULT 0,
                rating INTEGER NOT NULL DEFAULT 0,
                review TEXT DEFAULT '',
                synopsis TEXT DEFAULT ''
            )
            """
        )


init_db()


class BookCreate(BaseModel):
    title: str = Field(..., min_length=1)
    author: str = Field(..., min_length=1)
    isbn: str = ""
    category: Literal["quero_ler", "lendo", "concluido"] = "quero_ler"
    genre: str = "Literatura"
    year: Optional[int] = None
    total_pages: int = Field(default=200, ge=1)
    current_page: int = Field(default=0, ge=0)
    rating: int = Field(default=0, ge=0, le=5)
    review: str = ""
    synopsis: str = ""


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@app.get("/api/health")
def health():
    return {"status": "ok", "aiConfigured": bool(GEMINI_API_KEY)}


@app.get("/api/books")
def list_books(q: str = "", category: str = "all"):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM books ORDER BY rowid DESC").fetchall()
        books = [dict(row) for row in rows]

    if category != "all":
        books = [b for b in books if b["category"] == category]
    if q.strip():
        needle = q.strip().lower()
        books = [
            b
            for b in books
            if needle in b["title"].lower()
            or needle in b["author"].lower()
            or needle in b["isbn"].lower()
        ]
    return {"books": books}


@app.post("/api/books", status_code=201)
def create_book(payload: BookCreate):
    book_id = f"book-{uuid.uuid4().hex[:8]}"
    current = payload.total_pages if payload.category == "concluido" else min(payload.current_page, payload.total_pages)
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO books (id, title, author, isbn, category, genre, year, total_pages, current_page, rating, review, synopsis)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                book_id,
                payload.title.strip(),
                payload.author.strip(),
                payload.isbn.strip(),
                payload.category,
                payload.genre.strip(),
                payload.year,
                payload.total_pages,
                current,
                payload.rating,
                payload.review.strip(),
                payload.synopsis.strip(),
            ),
        )
    return {"id": book_id, **payload.model_dump()}


@app.post("/api/ai/chat")
def chat_with_ai(payload: ChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Configure GEMINI_API_KEY no arquivo .env")

    client = genai.Client(api_key=GEMINI_API_KEY)
    with get_db() as conn:
        books = [dict(r) for r in conn.execute("SELECT title, author, category, rating FROM books").fetchall()]

    context = "\n".join(
        f"- {b['title']} ({b['author']}) [{b['category']}, nota {b['rating']}/5]"
        for b in books
    )
    prompt = "\n".join(f"{m.role}: {m.content}" for m in payload.messages[-10:])

    response = client.models.generate_content(
        model="gemini-4-hydrogen",
        contents=f"Acervo do usuário:\n{context}\n\nConversa:\n{prompt}",
    )
    return {"reply": response.text}
