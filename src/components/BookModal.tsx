import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { ReadingCategory } from '../types/library';

export interface NewBookPayload {
  title: string;
  author: string;
  isbn: string;
  category: ReadingCategory;
  genre: string;
  year: number | null;
  totalPages: number;
  currentPage: number;
  rating: number;
  synopsis: string;
  review: string;
  coverUrl?: string;
}

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: NewBookPayload) => Promise<void>;
}

export function BookModal({ isOpen, onClose, onSubmit }: BookModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState<ReadingCategory>('quero_ler');
  const [genre, setGenre] = useState('Literatura');
  const [year, setYear] = useState('');
  const [totalPages, setTotalPages] = useState('240');
  const [currentPage, setCurrentPage] = useState('0');
  const [rating, setRating] = useState('0');
  const [synopsis, setSynopsis] = useState('');
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      setError('Informe o título e o autor do livro.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        category,
        genre: genre.trim() || 'Literatura',
        year: year ? Number(year) : null,
        totalPages: Math.max(1, Number(totalPages) || 200),
        currentPage: Math.max(0, Number(currentPage) || 0),
        rating: Number(rating) || 0,
        synopsis: synopsis.trim(),
        review: review.trim(),
      });
      setTitle('');
      setAuthor('');
      setIsbn('');
      setCategory('quero_ler');
      setGenre('Literatura');
      setYear('');
      setTotalPages('240');
      setCurrentPage('0');
      setRating('0');
      setSynopsis('');
      setReview('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar livro.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-new-book-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#1A1D1B] p-6 text-[#ECEEEB] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 id="modal-new-book-title" className="font-display text-2xl font-medium">
              Cadastrar Livro
            </h2>
            <p className="mt-1 text-sm text-[#9CA39E]">
              Adicione uma obra manualmente ao seu acervo pessoal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#9CA39E] transition-colors hover:bg-white/5 hover:text-[#ECEEEB] focus-visible:outline-2 focus-visible:outline-[#8FA893]"
            aria-label="Fechar janela"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9CA39E]">Título *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Grande Sertão: Veredas"
                className="w-full rounded-lg border border-white/10 bg-[#121413] px-3.5 py-2.5 text-sm text-[#ECEEEB] placeholder-[#6F7772] focus:border-[#8FA893] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9CA39E]">Autor *</label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ex.: João Guimarães Rosa"
                className="w-full rounded-lg border border-white/10 bg-[#121413] px-3.5 py-2.5 text-sm text-[#ECEEEB] placeholder-[#6F7772] focus:border-[#8FA893] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9CA39E]">ISBN</label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="9788535910663"
                className="font-mono-tabular w-full rounded-lg border border-white/10 bg-[#121413] px-3.5 py-2.5 text-sm text-[#ECEEEB] placeholder-[#6F7772] focus:border-[#8FA893] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9CA39E]">Gênero</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Romance, Ensaio, Ficção..."
                className="w-full rounded-lg border border-white/10 bg-[#121413] px-3.5 py-2.5 text-sm text-[#ECEEEB] placeholder-[#6F7772] focus:border-[#8FA893] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9CA39E]">Ano</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="1956"
                className="font-mono-tabular w-full rounded-lg border border-white/10 bg-[#121413] px-3.5 py-2.5 text-sm text-[#ECEEEB] placeholder-[#6F7772] focus:border-[#8FA893] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9CA39E]">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReadingCategory)}
                className="w-full rounded-lg border border-white/10 bg-[#121413] px-3 py-2.5 text-sm text-[#ECEEEB] focus:border-[#8FA893] focus:outline-none"
              >
                <option value="quero_ler">Quero Ler</option>
                <option value="lendo">Lendo</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9CA39E]">Total de Páginas</label>
              <input
                type="number"
                min={1}
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                className="font-mono-tabular w-full rounded-lg border border-white/10 bg-[#121413] px-3.5 py-2.5 text-sm text-[#ECEEEB] focus:border-[#8FA893] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9CA39E]">Página Atual</label>
              <input
                type="number"
                min={0}
                value={category === 'concluido' ? totalPages : currentPage}
                disabled={category === 'concluido'}
                onChange={(e) => setCurrentPage(e.target.value)}
                className="font-mono-tabular w-full rounded-lg border border-white/10 bg-[#121413] px-3.5 py-2.5 text-sm text-[#ECEEEB] disabled:opacity-50 focus:border-[#8FA893] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9CA39E]">Avaliação (0–5)</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="font-mono-tabular w-full rounded-lg border border-white/10 bg-[#121413] px-3 py-2.5 text-sm text-[#ECEEEB] focus:border-[#8FA893] focus:outline-none"
              >
                <option value="0">Sem nota</option>
                <option value="1">1 estrela</option>
                <option value="2">2 estrelas</option>
                <option value="3">3 estrelas</option>
                <option value="4">4 estrelas</option>
                <option value="5">5 estrelas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#9CA39E]">Sinopse</label>
            <textarea
              rows={2}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Breve descrição da obra..."
              className="w-full rounded-lg border border-white/10 bg-[#121413] px-3.5 py-2.5 text-sm text-[#ECEEEB] placeholder-[#6F7772] focus:border-[#8FA893] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#9CA39E]">Resenha Pessoal</label>
            <textarea
              rows={2}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Suas impressões, citações favoritas ou anotações..."
              className="w-full rounded-lg border border-white/10 bg-[#121413] px-3.5 py-2.5 text-sm text-[#ECEEEB] placeholder-[#6F7772] focus:border-[#8FA893] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-[#9CA39E] transition-colors hover:bg-white/5 hover:text-[#ECEEEB] whitespace-nowrap shrink-0"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#8FA893] px-5 py-2 text-sm font-semibold text-[#121413] transition-colors hover:bg-[#A1B9A5] disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {submitting ? 'Salvando...' : 'Salvar Livro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
