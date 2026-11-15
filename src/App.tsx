import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Compass, MessageSquare, Plus, Search, Settings, Star } from 'lucide-react';
import type { Book, ReadingCategory } from './types/library';
import { resolveBookCover } from './lib/covers';
import { BookCover } from './components/BookCover';
import { BookModal, type NewBookPayload } from './components/BookModal';
import { BookDetailDrawer } from './components/BookDetailDrawer';
import { DiscoverView } from './components/DiscoverView';
import { LibrarianChat } from './components/LibrarianChat';
import { ConfigGuideView } from './components/ConfigGuideView';

type ActiveTab = 'library' | 'discover' | 'chat' | 'config';
type ShelfFilter = 'all' | ReadingCategory;

const SHELF_LABELS: Record<ReadingCategory, string> = {
  quero_ler: 'Quero Ler',
  lendo: 'Lendo',
  concluido: 'Concluído',
};

const SHELF_TEXT_COLORS: Record<ReadingCategory, string> = {
  concluido: 'text-[#8FA893]',
  lendo: 'text-[#D4A359]',
  quero_ler: 'text-[#8EA4B8]',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [shelfFilter, setShelfFilter] = useState<ShelfFilter>('all');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [chatSeedPrompt, setChatSeedPrompt] = useState<string | null>(null);

  async function fetchBooks() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/books');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar acervo.');
      }
      setBooks(data.books ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBooks();
  }, []);

  async function handleAddBook(payload: NewBookPayload) {
    const response = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao cadastrar livro.');
    }
    setBooks((prev) => [data.book, ...prev]);
  }

  async function handleUpdateBook(id: string, patch: Partial<Book>) {
    const response = await fetch(`/api/books/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao atualizar livro.');
    }
    setBooks((prev) => prev.map((b) => (b.id === id ? data.book : b)));
    setSelectedBook((prev) => (prev && prev.id === id ? data.book : prev));
  }

  async function handleDeleteBook(id: string) {
    const response = await fetch(`/api/books/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error('Erro ao remover livro.');
    }
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setSelectedBook(null);
  }

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((book) => {
      if (shelfFilter !== 'all' && book.category !== shelfFilter) return false;
      if (!q) return true;
      return (
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.isbn.toLowerCase().includes(q) ||
        book.genre.toLowerCase().includes(q)
      );
    });
  }, [books, searchQuery, shelfFilter]);

  const metrics = useMemo(() => {
    const totalBooks = books.length;
    const readingNow = books.filter((b) => b.category === 'lendo').length;
    const finishedCount = books.filter((b) => b.category === 'concluido').length;
    const pagesRead = books.reduce((sum, b) => sum + (b.currentPage || 0), 0);
    const rated = books.filter((b) => b.rating > 0);
    const avgRating =
      rated.length > 0 ? (rated.reduce((sum, b) => sum + b.rating, 0) / rated.length).toFixed(1) : '—';
    return { totalBooks, readingNow, finishedCount, pagesRead, avgRating };
  }, [books]);

  function openChatWithPrompt(prompt: string) {
    setSelectedBook(null);
    setChatSeedPrompt(prompt);
    setActiveTab('chat');
  }

  return (
    <div className="min-h-screen bg-[#121413] text-[#ECEEEB]">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#121413]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-4 sm:px-6">
          {/* Zone 1: Single-line brand wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className="font-display text-xl font-medium tracking-tight text-[#ECEEEB] whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-[#8FA893]"
          >
            Biblioteca Inteligente
          </button>

          {/* Zone 2: Concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'library'
                  ? 'text-[#ECEEEB] border-b border-[#8FA893]'
                  : 'text-[#9CA39E] hover:text-[#ECEEEB]'
              }`}
            >
              Acervo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'discover'
                  ? 'text-[#ECEEEB] border-b border-[#8FA893]'
                  : 'text-[#9CA39E] hover:text-[#ECEEEB]'
              }`}
            >
              Explorar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'chat'
                  ? 'text-[#ECEEEB] border-b border-[#8FA893]'
                  : 'text-[#9CA39E] hover:text-[#ECEEEB]'
              }`}
            >
              Assistente IA
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'config'
                  ? 'text-[#ECEEEB] border-b border-[#8FA893]'
                  : 'text-[#9CA39E] hover:text-[#ECEEEB]'
              }`}
            >
              Configuração
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#8FA893] px-4 py-2 text-xs font-semibold text-[#121413] transition-colors hover:bg-[#A1B9A5] whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              Novo Livro
            </button>
          </div>
        </div>

        {/* Mobile navigation row (clean single-line items, under 15% sticky height cap) */}
        <nav className="flex md:hidden items-center justify-around border-t border-white/10 px-2 py-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'library' ? 'text-[#8FA893]' : 'text-[#9CA39E]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Acervo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'discover' ? 'text-[#8FA893]' : 'text-[#9CA39E]'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            Explorar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'chat' ? 'text-[#8FA893]' : 'text-[#9CA39E]'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Assistente
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'config' ? 'text-[#8FA893]' : 'text-[#9CA39E]'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Configuração
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {activeTab === 'library' && (
          <div className="space-y-8">
            {/* Editorial Header + Real Reading Metrics */}
            <section className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end">
              <div className="max-w-xl">
                <h1 className="font-display text-3xl font-medium tracking-tight text-[#ECEEEB] sm:text-4xl">
                  Seu Acervo Pessoal de Leituras
                </h1>
                <p className="mt-2.5 text-sm leading-relaxed text-[#9CA39E]">
                  Organize livros entre Quero Ler, Lendo e Concluído, registre seu progresso por
                  página e conte com explicações literárias inteligentes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-8">
                <div>
                  <p className="text-xs text-[#7C8680]">Total de Obras</p>
                  <p className="font-mono-tabular mt-1 text-2xl font-medium text-[#ECEEEB]">
                    {metrics.totalBooks}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#7C8680]">Lendo Agora</p>
                  <p className="font-mono-tabular mt-1 text-2xl font-medium text-[#D4A359]">
                    {metrics.readingNow}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#7C8680]">Páginas Lidas</p>
                  <p className="font-mono-tabular mt-1 text-2xl font-medium text-[#8FA893]">
                    {metrics.pagesRead}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#7C8680]">Nota Média</p>
                  <p className="font-mono-tabular mt-1 text-2xl font-medium text-[#ECEEEB]">
                    {metrics.avgRating}
                  </p>
                </div>
              </div>
            </section>

            {/* Barra de Pesquisa e Filtros por Categoria */}
            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F7772]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar por título, autor ou ISBN..."
                  aria-label="Filtrar livros por título, autor ou ISBN"
                  className="w-full rounded-lg border border-white/10 bg-[#1A1D1B] py-2.5 pl-10 pr-4 text-sm text-[#ECEEEB] placeholder-[#6F7772] focus:border-[#8FA893] focus:outline-none"
                />
              </div>

              <div className="inline-flex overflow-x-auto rounded-lg border border-white/10 bg-[#1A1D1B] p-1">
                {(
                  [
                    { key: 'all', label: 'Todos' },
                    { key: 'lendo', label: 'Lendo' },
                    { key: 'quero_ler', label: 'Quero Ler' },
                    { key: 'concluido', label: 'Concluído' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setShelfFilter(tab.key)}
                    className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      shelfFilter === tab.key
                        ? 'bg-[#8FA893] text-[#121413]'
                        : 'text-[#9CA39E] hover:text-[#ECEEEB]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Estados de Carregamento, Erro, Vazio e Grade de Livros */}
            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-950/30 p-5 text-sm text-red-200">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
                {[1, 2, 3, 4].map((skeleton) => (
                  <div
                    key={skeleton}
                    className="h-52 animate-pulse rounded-xl border border-white/10 bg-[#1A1D1B]"
                  />
                ))}
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#1A1D1B] p-10 text-center">
                <h2 className="font-display text-xl font-medium text-[#ECEEEB]">
                  Nenhum livro encontrado nesta estante
                </h2>
                <p className="mt-2 text-sm text-[#9CA39E]">
                  {searchQuery
                    ? 'Tente buscar outro título, autor ou ISBN, ou limpe os filtros.'
                    : 'Comece adicionando seu primeiro livro manualmente ou explore o catálogo gratuito.'}
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  {searchQuery || shelfFilter !== 'all' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setShelfFilter('all');
                      }}
                      className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-[#ECEEEB] hover:bg-white/5"
                    >
                      Limpar Filtros
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(true)}
                    className="rounded-lg bg-[#8FA893] px-4 py-2 text-sm font-semibold text-[#121413] hover:bg-[#A1B9A5]"
                  >
                    Adicionar Livro
                  </button>
                </div>
              </div>
            ) : (
              <section className="grid gap-5 md:grid-cols-2">
                {filteredBooks.map((book) => {
                  const pct =
                    book.totalPages > 0
                      ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
                      : 0;
                  return (
                    <article
                      key={book.id}
                      onClick={() => setSelectedBook(book)}
                      className="group flex cursor-pointer gap-5 rounded-xl border border-white/10 bg-[#1A1D1B] p-5 transition-colors hover:border-[#8FA893]/40"
                    >
                      <BookCover
                        src={resolveBookCover(book)}
                        title={book.title}
                        author={book.author}
                        className="h-44 w-32 shrink-0"
                      />

                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          {/* Unboxed metadata with typographic separators */}
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className={`font-medium ${SHELF_TEXT_COLORS[book.category]}`}>
                              {SHELF_LABELS[book.category]}
                            </span>
                            {book.rating > 0 && (
                              <span className="inline-flex items-center gap-1 font-mono-tabular text-[#D4A359]">
                                <Star className="h-3.5 w-3.5 fill-[#D4A359]" aria-hidden="true" />
                                {book.rating}/5
                              </span>
                            )}
                          </div>

                          <h2 className="mt-1.5 font-display text-xl font-medium leading-snug text-[#ECEEEB] group-hover:text-[#C5D6C8] transition-colors line-clamp-2">
                            {book.title}
                          </h2>
                          <p className="mt-1 text-sm text-[#A9B2AC] truncate">{book.author}</p>

                          <p className="mt-2 text-xs text-[#7C8680] truncate">
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
                                <span className="font-mono-tabular">{book.isbn}</span>
                              </>
                            )}
                          </p>

                          {book.review && (
                            <p className="mt-3 text-xs leading-relaxed text-[#9CA39E] line-clamp-2">
                              “{book.review}”
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/10">
                          <div className="flex items-center justify-between text-xs text-[#9CA39E]">
                            <span className="font-mono-tabular">
                              {book.currentPage} / {book.totalPages} págs
                            </span>
                            <span className="font-mono-tabular text-[#8FA893]">{pct}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-[#8FA893] transition-all duration-200"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <DiscoverView existingBooks={books} onAddBook={handleAddBook} />
        )}

        {activeTab === 'chat' && (
          <LibrarianChat
            books={books}
            initialPrompt={chatSeedPrompt}
            onConsumeInitialPrompt={() => setChatSeedPrompt(null)}
          />
        )}

        {activeTab === 'config' && <ConfigGuideView />}
      </main>

      <footer className="mt-12 border-t border-white/10 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-[#6F7772] sm:flex-row sm:px-6">
          <p>Biblioteca Inteligente · Acervo pessoal com curadoria literária</p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className="hover:text-[#ECEEEB] transition-colors"
            >
              Acervo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              className="hover:text-[#ECEEEB] transition-colors"
            >
              Explorar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className="hover:text-[#ECEEEB] transition-colors"
            >
              Arquitetura e Configuração
            </button>
          </div>
        </div>
      </footer>

      <BookModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleAddBook}
      />

      <BookDetailDrawer
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onUpdate={handleUpdateBook}
        onDelete={handleDeleteBook}
        onAskInChat={openChatWithPrompt}
      />
    </div>
  );
}
