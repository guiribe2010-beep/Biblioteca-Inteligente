export type ReadingCategory = 'quero_ler' | 'lendo' | 'concluido';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: ReadingCategory;
  genre: string;
  year: number | null;
  totalPages: number;
  currentPage: number;
  rating: number;
  review: string;
  synopsis: string;
  coverKey?: 'dom_casmurro' | 'duna' | '1984' | 'hora_estrela';
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoverBookResult {
  key: string;
  title: string;
  author: string;
  isbn: string;
  year: number | null;
  totalPages: number;
  genre: string;
  coverUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface BookAnalysis {
  resumo: string;
  personagens: Array<{ nome: string; papel: string }>;
  temas: string[];
  acontecimentosChave: string[];
  conceitosLiterarios: string[];
}

export interface BookRecommendation {
  title: string;
  author: string;
  isbn: string;
  genre: string;
  estimatedPages: number;
  reason: string;
}
