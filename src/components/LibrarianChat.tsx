import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send, Trash2 } from 'lucide-react';
import type { Book, ChatMessage } from '../types/library';

interface LibrarianChatProps {
  books: Book[];
  initialPrompt?: string | null;
  onConsumeInitialPrompt?: () => void;
}

const STARTER_PROMPTS = [
  'Recomende 3 livros com base nas obras e avaliações do meu acervo.',
  'Explique os principais temas e personagens do livro que estou lendo agora.',
  'Qual a diferença entre realismo machadiano e o fluxo de consciência de Clarice Lispector?',
  'Sugira um plano de leitura semanal considerando as páginas que faltam nos meus livros.',
];

export function LibrarianChat({
  books,
  initialPrompt,
  onConsumeInitialPrompt,
}: LibrarianChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá! Sou o curador literário da sua Biblioteca Inteligente. Já conheço os livros cadastrados no seu acervo, seu progresso de leitura e suas avaliações. Sobre qual obra, personagem, tema ou próxima leitura você gostaria de conversar?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      onConsumeInitialPrompt?.();
    }
  }, [initialPrompt, onConsumeInitialPrompt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao conversar com o assistente.');
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado na conversa.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleReset() {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content:
          'Conversa reiniciada. Como posso ajudar nas suas leituras hoje? Posso explicar conceitos, resumir personagens sem spoilers ou recomendar novos títulos.',
        timestamp: new Date().toISOString(),
      },
    ]);
    setError(null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Coluna de Contexto e Sugestões */}
      <aside className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-medium text-[#ECEEEB]">Assistente Literário</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#9CA39E]">
            Converse sobre livros, peça explicações de personagens, temas e acontecimentos ou
            solicite recomendações personalizadas.
          </p>
          <p className="mt-3 font-mono-tabular text-xs text-[#8FA893]">
            {books.length} {books.length === 1 ? 'livro sincronizado' : 'livros sincronizados'} no contexto
          </p>
        </div>

        <div className="border-t border-white/10 pt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9CA39E]">
            Perguntas Rápidas
          </h2>
          <div className="mt-3 space-y-2">
            {STARTER_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={loading}
                className="w-full rounded-lg border border-white/10 bg-[#1A1D1B] px-3.5 py-2.5 text-left text-xs leading-relaxed text-[#D0D5D1] transition-colors hover:border-[#8FA893]/40 hover:text-[#ECEEEB] disabled:opacity-60"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Área Principal do Chat */}
      <section
        className="flex h-[70vh] min-h-[500px] flex-col rounded-xl border border-white/10 bg-[#1A1D1B]"
        aria-label="Conversa com o assistente literário"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div>
            <p className="text-sm font-medium text-[#ECEEEB]">Curador de Leituras</p>
            <p className="text-xs text-[#7C8680]">
              Modelo Gemini integrado no servidor · Sem exposição de chaves no navegador
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#9CA39E] transition-colors hover:bg-white/5 hover:text-[#ECEEEB]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpar
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#8FA893] text-[#121413] font-medium'
                    : 'border border-white/10 bg-[#121413] text-[#E0E4E1]'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl border border-white/10 bg-[#121413] px-4 py-3 text-sm text-[#9CA39E]">
                Analisando sua biblioteca e preparando resposta...
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre um livro, personagem, tema ou peça uma recomendação..."
              className="flex-1 rounded-lg border border-white/10 bg-[#121413] px-4 py-2.5 text-sm text-[#ECEEEB] placeholder-[#6F7772] focus:border-[#8FA893] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#8FA893] px-5 py-2.5 text-sm font-semibold text-[#121413] transition-colors hover:bg-[#A1B9A5] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Send className="h-4 w-4" />
              Enviar
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
