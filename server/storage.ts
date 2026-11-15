import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Book, ReadingCategory } from '../src/types/library.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LIBRARY_FILE = path.join(DATA_DIR, 'library.json');

const SEED_BOOKS: Book[] = [
  {
    id: 'seed-dom-casmurro',
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    isbn: '9788535910663',
    category: 'concluido',
    genre: 'Romance Realista',
    year: 1899,
    totalPages: 288,
    currentPage: 288,
    rating: 5,
    review:
      'Narrativa magistral sobre memória, ciúme e ambiguidade. A voz de Bento Santiago faz o leitor questionar cada detalhe até a última página.',
    synopsis:
      'Bento Santiago narra sua juventude ao lado de Capitu e a dúvida que consome seu casamento ao longo da vida adulta.',
    coverKey: 'dom_casmurro',
    createdAt: '2026-10-10T14:20:00.000Z',
    updatedAt: '2026-11-02T19:45:00.000Z',
  },
  {
    id: 'seed-duna',
    title: 'Duna',
    author: 'Frank Herbert',
    isbn: '9788576573135',
    category: 'lendo',
    genre: 'Ficção Científica',
    year: 1965,
    totalPages: 680,
    currentPage: 312,
    rating: 5,
    review:
      'Construção de mundo impressionante envolvendo ecologia planetária, política imperial e espiritualidade em Arrakis.',
    synopsis:
      'Paul Atreides parte para o planeta desértico Arrakis, fonte da especiaria melange, enfrentando intrigas políticas e o destino dos Fremen.',
    coverKey: 'duna',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-14T21:10:00.000Z',
  },
  {
    id: 'seed-1984',
    title: '1984',
    author: 'George Orwell',
    isbn: '9788535914849',
    category: 'concluido',
    genre: 'Distopia Política',
    year: 1949,
    totalPages: 416,
    currentPage: 416,
    rating: 5,
    review:
      'Um alerta atemporal sobre vigilância, manipulação da linguagem (Novilíngua) e apagamento da memória histórica.',
    synopsis:
      'Winston Smith vive sob o olhar constante do Grande Irmão na Oceânia e tenta preservar sua individualidade e verdade.',
    coverKey: '1984',
    createdAt: '2026-09-18T16:30:00.000Z',
    updatedAt: '2026-10-20T18:15:00.000Z',
  },
  {
    id: 'seed-hora-da-estrela',
    title: 'A Hora da Estrela',
    author: 'Clarice Lispector',
    isbn: '9788532530837',
    category: 'quero_ler',
    genre: 'Ficção Brasileira',
    year: 1977,
    totalPages: 88,
    currentPage: 0,
    rating: 0,
    review: '',
    synopsis:
      'O escritor Rodrigo S.M. relata a trajetória silenciosa de Macabéa, datilógrafa alagoana recém-chegada ao Rio de Janeiro.',
    coverKey: 'hora_estrela',
    createdAt: '2026-11-12T09:15:00.000Z',
    updatedAt: '2026-11-12T09:15:00.000Z',
  },
];

async function ensureStorage(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(LIBRARY_FILE);
  } catch {
    await fs.writeFile(LIBRARY_FILE, JSON.stringify(SEED_BOOKS, null, 2), 'utf-8');
  }
}

export async function readBooks(): Promise<Book[]> {
  await ensureStorage();
  const raw = await fs.readFile(LIBRARY_FILE, 'utf-8');
  const parsed = JSON.parse(raw) as Book[];
  return Array.isArray(parsed) ? parsed : [];
}

async function writeBooks(books: Book[]): Promise<void> {
  await ensureStorage();
  await fs.writeFile(LIBRARY_FILE, JSON.stringify(books, null, 2), 'utf-8');
}

export interface CreateBookInput {
  title: string;
  author: string;
  isbn?: string;
  category?: ReadingCategory;
  genre?: string;
  year?: number | null;
  totalPages?: number;
  currentPage?: number;
  rating?: number;
  review?: string;
  synopsis?: string;
  coverUrl?: string;
}

export async function createBook(input: CreateBookInput): Promise<Book> {
  const books = await readBooks();
  const now = new Date().toISOString();
  const totalPages = Math.max(1, Number(input.totalPages) || 200);
  const category: ReadingCategory = input.category ?? 'quero_ler';
  let currentPage = Math.max(0, Math.min(totalPages, Number(input.currentPage) || 0));
  if (category === 'concluido') {
    currentPage = totalPages;
  }

  const newBook: Book = {
    id: `book-${crypto.randomUUID().slice(0, 8)}`,
    title: input.title.trim(),
    author: input.author.trim(),
    isbn: (input.isbn ?? '').replace(/[^0-9Xx-]/g, '').trim(),
    category,
    genre: (input.genre ?? 'Literatura').trim() || 'Literatura',
    year: input.year ? Number(input.year) : null,
    totalPages,
    currentPage,
    rating: Math.max(0, Math.min(5, Number(input.rating) || 0)),
    review: (input.review ?? '').trim(),
    synopsis: (input.synopsis ?? '').trim(),
    coverUrl: input.coverUrl?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  books.unshift(newBook);
  await writeBooks(books);
  return newBook;
}

export async function updateBook(
  id: string,
  patch: Partial<Omit<Book, 'id' | 'createdAt'>>
): Promise<Book | null> {
  const books = await readBooks();
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const existing = books[index];
  const nextTotalPages =
    patch.totalPages !== undefined ? Math.max(1, Number(patch.totalPages) || existing.totalPages) : existing.totalPages;
  const nextCategory = patch.category ?? existing.category;

  let nextCurrentPage =
    patch.currentPage !== undefined
      ? Math.max(0, Math.min(nextTotalPages, Number(patch.currentPage) || 0))
      : Math.min(existing.currentPage, nextTotalPages);

  if (patch.category === 'concluido') {
    nextCurrentPage = nextTotalPages;
  } else if (patch.category === 'quero_ler' && patch.currentPage === undefined) {
    nextCurrentPage = 0;
  }

  const updated: Book = {
    ...existing,
    ...patch,
    title: patch.title !== undefined ? patch.title.trim() : existing.title,
    author: patch.author !== undefined ? patch.author.trim() : existing.author,
    isbn: patch.isbn !== undefined ? patch.isbn.trim() : existing.isbn,
    genre: patch.genre !== undefined ? patch.genre.trim() : existing.genre,
    review: patch.review !== undefined ? patch.review.trim() : existing.review,
    synopsis: patch.synopsis !== undefined ? patch.synopsis.trim() : existing.synopsis,
    totalPages: nextTotalPages,
    currentPage: nextCurrentPage,
    category: nextCategory,
    rating:
      patch.rating !== undefined ? Math.max(0, Math.min(5, Number(patch.rating) || 0)) : existing.rating,
    updatedAt: new Date().toISOString(),
  };

  books[index] = updated;
  await writeBooks(books);
  return updated;
}

export async function deleteBook(id: string): Promise<boolean> {
  const books = await readBooks();
  const filtered = books.filter((b) => b.id !== id);
  if (filtered.length === books.length) return false;
  await writeBooks(filtered);
  return true;
}
