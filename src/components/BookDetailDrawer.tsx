import { useEffect, useState } from 'react';
import { BookOpen, MessageSquare, Sparkles, Star, Trash2, X } from 'lucide-react';
import type { Book, BookAnalysis, ReadingCategory } from '../types/library';
import { resolveBookCover } from '../lib/covers';
import { BookCover } from './BookCover';

interface BookDetailDrawerProps {
  book: Book | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Book>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAskInChat: (prompt: string) => void;
}

const CATEGORY_OPTIONS: Array<{ value: ReadingCategory; label: string }> = [
  { value: 'quero_ler', label: 'Quero Ler' },
  { value: 'lendo', label: 'Lendo' },
  { value: 'concluido', label: 'Concluído' },
];

export function BookDetailDrawer({
  book,
  onClose,
  onUpdate,
  onDelete,
  onAskInChat,
}: BookDetailDrawerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [category, setCategory] = useState<ReadingCategory>('quero_ler');
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const [focusQuestion, setFocusQuestion] = useState('');
  const [analysis, setAnalysis] = useState<BookAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (book) {
      setCurrentPage(book.currentPage);
      setTotalPages(book.totalPages);
      setRating(book.rating);
      setReview(book.review);
      setCategory(book.category);
      setAnalysis(null);
      setAnalysisError(null);
      setFocusQuestion('');
      setConfirmDelete(false);
      setSavedFeedback(false);
    }
  }, [book]);

  if (!book) return null;

  const progressPct = totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;

  async function handleSaveProgress() {
    if (!book) return;
    setSaving(true);
    try {
      await onUpdate(book.id, {
        category,
        currentPage: category === 'concluido' ? totalPages : currentPage,
        totalPages,
        rating,
        review,
      });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleCategoryChange(nextCategory: ReadingCategory) {
    if (!book) return;
    setCategory(nextCategory);
    const nextPage = nextCategory === 'concluido' ? totalPages : nextCategory === 'quero_ler' ? 0 : currentPage;
    setCurrentPage(nextPage);
    await onUpdate(book.id, { category: nextCategory, currentPage: nextPage });
  }

  async function handleAnalyzeBook() {
    if (!book) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/api/ai/analyze-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          focus: focusQuestion.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar obra.');
      }
      setAnalysis(data.analysis);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Erro ao consultar IA.');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${book.title}`}
    >
      <div className="flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-white/10 bg-[#161917] p-6 text-[#ECEEEB] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex gap-4">
            <BookCover
              src={resolveBookCover(book)}
              title={book.title}
              author={book.author}
              className="h-32 w-24 shrink-0"
            />
            <div>
              <h2 className="font-display text-2xl font-medium leading-tight text-[#ECEEEB]">
                {book.title}
              </h2>
              <p className="mt-1 text-sm text-[#A9B2AC]">{book.author}</p>
              <p className="mt-2 text-xs text-[#7C8680]">
                <span>{book.genre}</span>
                {book.year && (
                  <>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span className="font-mono-tabular">{book.year}</span>
                  </>
                )}
                {book.isbn && (
                  <>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span className="font-mono-tabular">ISBN {book.isbn}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#9CA39E] transition-colors hover:bg-white/5 hover:text-[#ECEEEB]"
            aria-label="Fechar painel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {book.synopsis && (
          <div className="border-b border-white/10 py-4">
            <h3 className="text-xs font-medium text-[#9CA39E]">Sinopse</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#D0D5D1]">{book.synopsis}</p>
          </div>
        )}

        {/* Categoria de Leitura */}
        <div className="border-b border-white/10 py-5">
          <span className="block text-xs font-medium text-[#9CA39E]">Estante de Leitura</span>
          <div className="mt-2.5 inline-flex rounded-lg bg-[#121413] p-1 border border-white/10">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleCategoryChange(opt.value)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  category === opt.value
                    ? 'bg-[#8FA893] text-[#121413]'
                    : 'text-[#9CA39E] hover:text-[#ECEEEB]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Progresso */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-[#9CA39E]">
                <span>Página atual</span>
                <span className="font-mono-tabular text-[#8FA893]">{progressPct}%</span>
              </label>
              <input
                type="number"
                min={0}
                max={totalPages}
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.max(0, Math.min(totalPages, Number(e.target.value) || 0)))}
                className="font-mono-tabular w-full rounded-lg border border-white/10 bg-[#121413] px-3 py-2 text-sm text-[#ECEEEB] focus:border-[#8FA893] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9CA39E]">Total de páginas</label>
              <input
                type="number"
                min={1}
                value={totalPages}
                onChange={(e) => setTotalPages(Math.max(1, Number(e.target.value) || 1))}
                className="font-mono-tabular w-full rounded-lg border border-white/10 bg-[#121413] px-3 py-2 text-sm text-[#ECEEEB] focus:border-[#8FA893] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#8FA893] transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Avaliação por estrelas */}
          <div className="mt-5">
            <span className="block text-xs font-medium text-[#9CA39E]">Sua Avaliação</span>
            <div className="mt-2 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? 0 : star)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#121413] transition-colors hover:border-[#8FA893]/50"
                  aria-label={`${star} estrelas`}
                >
                  <Star
                    className={`h-4 w-4 ${
                      star <= rating ? 'fill-[#D4A359] text-[#D4A359]' : 'text-[#5C6460]'
                    }`}
                  />
                </button>
              ))}
              <span className="font-mono-tabular ml-2 text-xs text-[#9CA39E]">
                {rating > 0 ? `${rating}/5` : 'Sem nota'}
              </span>
            </div>
          </div>

          {/* Resenha */}
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-[#9CA39E]">
              Resenha e Anotações de Leitura
            </label>
            <textarea
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Escreva suas reflexões sobre personagens, escrita ou trechos marcantes..."
              className="w-full rounded-lg border border-white/10 bg-[#121413] px-3.5 py-2.5 text-sm text-[#ECEEEB] placeholder-[#6F7772] focus:border-[#8FA893] focus:outline-none"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSaveProgress}
              disabled={saving}
              className="rounded-lg bg-[#8FA893] px-4 py-2 text-sm font-semibold text-[#121413] transition-colors hover:bg-[#A1B9A5] disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {saving ? 'Salvando...' : savedFeedback ? 'Alterações Salvas' : 'Salvar Progresso e Resenha'}
            </button>

            <button
              type="button"
              onClick={() =>
                onAskInChat(`Gostaria de conversar sobre o livro "${book.title}" de ${book.author}.`)
              }
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-[#ECEEEB] transition-colors hover:bg-white/5 whitespace-nowrap shrink-0"
            >
              <MessageSquare className="h-4 w-4 text-[#8FA893]" />
              Conversar no Chatbot
            </button>
          </div>
        </div>

        {/* Inteligência Artificial: Explicação de Personagens, Temas e Conceitos */}
        <div className="py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-medium text-[#ECEEEB]">
                Guia Literário com IA
              </h3>
              <p className="mt-0.5 text-xs text-[#9CA39E]">
                Peça explicações de personagens, temas, acontecimentos ou conceitos da obra.
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={focusQuestion}
              onChange={(e) => setFocusQuestion(e.target.value)}
              placeholder="Opcional: ex. Explique o simbolismo da especiaria ou o papel de Capitu"
              className="flex-1 rounded-lg border border-white/10 bg-[#121413] px-3.5 py-2.5 text-sm text-[#ECEEEB] placeholder-[#6F7772] focus:border-[#8FA893] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAnalyzeBook}
              disabled={analyzing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#8FA893]/40 bg-[#8FA893]/15 px-4 py-2.5 text-sm font-medium text-[#C5D6C8] transition-colors hover:bg-[#8FA893]/25 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              {analyzing ? 'Analisando...' : 'Explicar Obra'}
            </button>
          </div>

          {analysisError && (
            <div className="mt-3 rounded-lg border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              {analysisError}
            </div>
          )}

          {analysis && (
            <div className="mt-4 space-y-4 rounded-xl border border-white/10 bg-[#121413] p-5">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8FA893]">
                  Contexto da Obra
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-[#D0D5D1]">{analysis.resumo}</p>
              </div>

              {analysis.personagens?.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8FA893]">
                    Personagens Centrais
                  </h4>
                  <ul className="mt-2 space-y-2 text-sm text-[#D0D5D1]">
                    {analysis.personagens.map((p, idx) => (
                      <li key={idx}>
                        <span className="font-medium text-[#ECEEEB]">{p.nome}:</span> {p.papel}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.temas?.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8FA893]">
                    Temas e Conceitos
                  </h4>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#D0D5D1]">
                    {analysis.temas.map((tema, idx) => (
                      <li key={idx}>{tema}</li>
                    ))}
                    {analysis.conceitosLiterarios?.map((c, idx) => (
                      <li key={`c-${idx}`}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.acontecimentosChave?.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8FA893]">
                    Acontecimentos Relevantes
                  </h4>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#D0D5D1]">
                    {analysis.acontecimentosChave.map((ev, idx) => (
                      <li key={idx}>{ev}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé de exclusão */}
        <div className="mt-auto border-t border-white/10 pt-4 flex items-center justify-between">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#9CA39E] transition-colors hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Remover livro do acervo
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-red-300">Confirmar remoção?</span>
              <button
                type="button"
                onClick={() => onDelete(book.id)}
                className="rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/30"
              >
                Sim, remover
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-[#9CA39E] hover:text-[#ECEEEB]"
              >
                Cancelar
              </button>
            </div>
          )}

          <span className="inline-flex items-center gap-1.5 text-xs text-[#6F7772]">
            <BookOpen className="h-3.5 w-3.5" />
            Salvo localmente
          </span>
        </div>
      </div>
    </div>
  );
}
