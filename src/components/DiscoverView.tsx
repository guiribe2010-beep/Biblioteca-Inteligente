import { useState, type FormEvent } from 'react';
import { Plus, Search, Sparkles } from 'lucide-react';
import type { Book, BookRecommendation, DiscoverBookResult, ReadingCategory } from '../types/library';
import type { NewBookPayload } from './BookModal';
import { BookCover } from './BookCover';

interface DiscoverViewProps {
  existingBooks: Book[];
  onAddBook: (payload: NewBookPayload) => Promise<void>;
}

export function DiscoverView({ existingBooks, onAddBook }: DiscoverViewProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<DiscoverBookResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [interest, setInterest] = useState('');
  const [recommending, setRecommending] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [addedKeys, setAddedKeys] = useState<Record<string, boolean>>({});

  function isAlreadyInLibrary(title: string, isbn: string) {
    const t = title.trim().toLowerCase();
    const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '');
    return existingBooks.some(
      (b) =>
        b.title.trim().toLowerCase() === t ||
        (cleanIsbn && b.isbn.replace(/[^0-9Xx]/g, '') === cleanIsbn)
    );
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/books/discover?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar livros.');
      }
      setResults(data.results ?? []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Falha na pesquisa.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleRecommend(e: FormEvent) {
    e.preventDefault();
    setRecommending(true);
    setRecError(null);
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interest: interest.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar recomendações.');
      }
      setRecommendations(data.recommendations ?? []);
    } catch (err) {
      setRecError(err instanceof Error ? err.message : 'Erro ao consultar IA.');
    } finally {
      setRecommending(false);
    }
  }

  async function quickAdd(
    itemKey: string,
    payload: NewBookPayload,
    category: ReadingCategory = 'quero_ler'
  ) {
    await onAddBook({ ...payload, category });
    setAddedKeys((prev) => ({ ...prev, [itemKey]: true }));
  }

  return (
    <div className="space-y-12">
      {/* Busca no Catálogo Público (Open Library) */}
      <section aria-labelledby="discover-search-heading">
        <div className="max-w-2xl">
          <h1 id="discover-search-heading" className="font-display text-3xl font-medium text-[#ECEEEB]">
            Explorar Livros e Recomendações
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#9CA39E]">
            Pesquise obras gratuitas no catálogo da Open Library por título, autor ou ISBN e adicione
            diretamente às suas estantes.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F7772]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite título, autor ou ISBN (ex.: 9788535910663, Clarice Lispector, Fundação)..."
              className="w-full rounded-lg border border-white/10 bg-[#1A1D1B] py-2.5 pl-10 pr-4 text-sm text-[#ECEEEB] placeholder-[#6F7772] focus:border-[#8FA893] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="rounded-lg bg-[#8FA893] px-5 py-2.5 text-sm font-semibold text-[#121413] transition-colors hover:bg-[#A1B9A5] disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {searching ? 'Pesquisando...' : 'Buscar no Catálogo'}
          </button>
        </form>

        {searchError && (
          <div className="mt-4 rounded-lg border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {searchError}
          </div>
        )}

        {hasSearched && !searching && results.length === 0 && !searchError && (
          <div className="mt-6 rounded-xl border border-white/10 bg-[#1A1D1B] p-8 text-center">
            <p className="text-sm text-[#9CA39E]">
              Nenhum livro encontrado para "{query}". Tente outro termo ou cadastre manualmente pelo
              botão "+ Novo Livro".
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((item) => {
              const inLibrary = isAlreadyInLibrary(item.title, item.isbn) || addedKeys[item.key];
              return (
                <article
                  key={item.key}
                  className="flex gap-4 rounded-xl border border-white/10 bg-[#1A1D1B] p-4"
                >
                  <BookCover
                    src={item.coverUrl}
                    title={item.title}
                    author={item.author}
                    className="h-32 w-24 shrink-0"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <h3 className="font-display text-base font-medium leading-snug text-[#ECEEEB] line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-[#A9B2AC] truncate">{item.author}</p>
                      <p className="mt-2 text-xs text-[#6F7772]">
                        <span>{item.genre}</span>
                        {item.year && (
                          <>
                            <span className="mx-1.5" aria-hidden="true">·</span>
                            <span className="font-mono-tabular">{item.year}</span>
                          </>
                        )}
                      </p>
                      {item.isbn && (
                        <p className="font-mono-tabular mt-0.5 text-[11px] text-[#6F7772] truncate">
                          ISBN {item.isbn}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={inLibrary}
                      onClick={() =>
                        quickAdd(item.key, {
                          title: item.title,
                          author: item.author,
                          isbn: item.isbn,
                          category: 'quero_ler',
                          genre: item.genre,
                          year: item.year,
                          totalPages: item.totalPages,
                          currentPage: 0,
                          rating: 0,
                          synopsis: '',
                          review: '',
                          coverUrl: item.coverUrl,
                        })
                      }
                      className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                        inLibrary
                          ? 'border border-white/10 bg-white/5 text-[#8FA893]'
                          : 'bg-[#8FA893]/15 text-[#C5D6C8] hover:bg-[#8FA893]/25 border border-[#8FA893]/30'
                      }`}
                    >
                      {inLibrary ? (
                        'No seu acervo'
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Quero Ler
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="h-px w-full bg-white/10" />

      {/* Recomendações Personalizadas com IA */}
      <section aria-labelledby="ai-rec-heading">
        <div className="max-w-2xl">
          <h2 id="ai-rec-heading" className="font-display text-2xl font-medium text-[#ECEEEB]">
            Recomendações Personalizadas com IA
          </h2>
          <p className="mt-1.5 text-sm text-[#9CA39E]">
            A IA analisa os gêneros, autores e avaliações do seu acervo para sugerir próximas
            leituras sob medida.
          </p>
        </div>

        <form onSubmit={handleRecommend} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="Interesse opcional: ex. suspense psicológico, filosofia prática, literatura latino-americana..."
            className="flex-1 rounded-lg border border-white/10 bg-[#1A1D1B] px-4 py-2.5 text-sm text-[#ECEEEB] placeholder-[#6F7772] focus:border-[#8FA893] focus:outline-none"
          />
          <button
            type="submit"
            disabled={recommending}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#8FA893]/40 bg-[#8FA893]/15 px-5 py-2.5 text-sm font-medium text-[#C5D6C8] transition-colors hover:bg-[#8FA893]/25 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            {recommending ? 'Gerando sugestões...' : 'Sugerir Próximas Leituras'}
          </button>
        </form>

        {recError && (
          <div className="mt-4 rounded-lg border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {recError}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {recommendations.map((rec, idx) => {
              const recKey = `rec-${idx}-${rec.title}`;
              const inLibrary = isAlreadyInLibrary(rec.title, rec.isbn) || addedKeys[recKey];
              return (
                <article
                  key={recKey}
                  className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#1A1D1B] p-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-medium text-[#ECEEEB]">
                          {rec.title}
                        </h3>
                        <p className="mt-0.5 text-sm text-[#A9B2AC]">{rec.author}</p>
                      </div>
                      <span className="font-mono-tabular text-xs text-[#6F7772] whitespace-nowrap">
                        ~{rec.estimatedPages} págs
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-[#7C8680]">
                      <span>{rec.genre}</span>
                      {rec.isbn && (
                        <>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span className="font-mono-tabular">ISBN {rec.isbn}</span>
                        </>
                      )}
                    </p>

                    <p className="mt-3 text-sm leading-relaxed text-[#D0D5D1]">{rec.reason}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                    <button
                      type="button"
                      disabled={inLibrary}
                      onClick={() =>
                        quickAdd(recKey, {
                          title: rec.title,
                          author: rec.author,
                          isbn: rec.isbn,
                          category: 'quero_ler',
                          genre: rec.genre,
                          year: null,
                          totalPages: rec.estimatedPages || 240,
                          currentPage: 0,
                          rating: 0,
                          synopsis: rec.reason,
                          review: '',
                        })
                      }
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                        inLibrary
                          ? 'bg-white/5 text-[#8FA893] border border-white/10'
                          : 'bg-[#8FA893] text-[#121413] hover:bg-[#A1B9A5]'
                      }`}
                    >
                      {inLibrary ? (
                        'Adicionado ao Acervo'
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar a Quero Ler
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
