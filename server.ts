import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { createBook, deleteBook, readBooks, updateBook } from './server/storage.ts';
import {
  analyzeBookWithAI,
  chatWithLibrarian,
  formatGeminiError,
  generateRecommendations,
} from './server/gemini.ts';
import type { DiscoverBookResult } from './src/types/library.ts';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Healthcheck
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Biblioteca Inteligente API',
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Listar e pesquisar livros do acervo pessoal (título, autor, ISBN e categoria)
  app.get('/api/books', async (req, res) => {
    try {
      const q = String(req.query.q ?? '').trim().toLowerCase();
      const category = String(req.query.category ?? '').trim();
      let books = await readBooks();

      if (category && category !== 'all') {
        books = books.filter((b) => b.category === category);
      }

      if (q) {
        books = books.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.isbn.toLowerCase().includes(q) ||
            b.genre.toLowerCase().includes(q)
        );
      }

      res.json({ books });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao listar livros.' });
    }
  });

  // Cadastrar novo livro
  app.post('/api/books', async (req, res) => {
    try {
      const { title, author } = req.body ?? {};
      if (!title || !author || !String(title).trim() || !String(author).trim()) {
        return res.status(400).json({ error: 'Título e autor são obrigatórios.' });
      }
      const book = await createBook(req.body);
      return res.status(201).json({ book });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao cadastrar livro.' });
    }
  });

  // Atualizar progresso, categoria, avaliação ou resenha
  app.patch('/api/books/:id', async (req, res) => {
    try {
      const updated = await updateBook(req.params.id, req.body ?? {});
      if (!updated) {
        return res.status(404).json({ error: 'Livro não encontrado.' });
      }
      return res.json({ book: updated });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao atualizar livro.' });
    }
  });

  // Remover livro
  app.delete('/api/books/:id', async (req, res) => {
    try {
      const removed = await deleteBook(req.params.id);
      if (!removed) {
        return res.status(404).json({ error: 'Livro não encontrado.' });
      }
      return res.json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao remover livro.' });
    }
  });

  // Busca gratuita de livros na Open Library (título, autor ou ISBN) sem necessidade de chave paga
  app.get('/api/books/discover', async (req, res) => {
    const query = String(req.query.q ?? '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Informe um título, autor ou ISBN para pesquisar.' });
    }

    try {
      const cleanIsbn = query.replace(/[^0-9Xx]/g, '');
      const isIsbn = cleanIsbn.length === 10 || cleanIsbn.length === 13;
      const url = isIsbn
        ? `https://openlibrary.org/search.json?isbn=${encodeURIComponent(cleanIsbn)}&limit=10`
        : `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'BibliotecaInteligente/1.0' },
      });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Open Library retornou HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        docs?: Array<{
          key?: string;
          title?: string;
          author_name?: string[];
          isbn?: string[];
          first_publish_year?: number;
          number_of_pages_median?: number;
          subject?: string[];
          cover_i?: number;
        }>;
      };

      const results: DiscoverBookResult[] = (data.docs ?? [])
        .filter((doc) => doc.title)
        .map((doc, idx) => ({
          key: doc.key ?? `ol-${idx}`,
          title: doc.title ?? 'Sem título',
          author: doc.author_name?.[0] ?? 'Autor desconhecido',
          isbn: doc.isbn?.[0] ?? '',
          year: doc.first_publish_year ?? null,
          totalPages: doc.number_of_pages_median ?? 220,
          genre: doc.subject?.[0] ?? 'Literatura Geral',
          coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
        }));

      return res.json({ results });
    } catch (error) {
      return res.status(502).json({
        error:
          error instanceof Error
            ? `Não foi possível consultar a Open Library agora (${error.message}). Você ainda pode cadastrar o livro manualmente.`
            : 'Erro ao consultar catálogo externo.',
      });
    }
  });

  // Chatbot literário com contexto da biblioteca do usuário
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const messages = req.body?.messages;
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Envie ao menos uma mensagem.' });
      }
      const books = await readBooks();
      const reply = await chatWithLibrarian(messages, books);
      return res.json({ reply });
    } catch (error) {
      const formatted = formatGeminiError(error);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Explicar personagens, temas, acontecimentos e conceitos de um livro específico
  app.post('/api/ai/analyze-book', async (req, res) => {
    try {
      const { bookId, focus } = req.body ?? {};
      const books = await readBooks();
      const book = books.find((b) => b.id === bookId);
      if (!book) {
        return res.status(404).json({ error: 'Livro não encontrado no acervo.' });
      }
      const analysis = await analyzeBookWithAI(book, focus ? String(focus) : undefined);
      return res.json({ analysis });
    } catch (error) {
      const formatted = formatGeminiError(error);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Recomendações personalizadas baseadas no acervo do usuário
  app.post('/api/ai/recommendations', async (req, res) => {
    try {
      const interest = req.body?.interest ? String(req.body.interest) : undefined;
      const books = await readBooks();
      const recommendations = await generateRecommendations(books, interest);
      return res.json({ recommendations });
    } catch (error) {
      const formatted = formatGeminiError(error);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Biblioteca Inteligente rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
