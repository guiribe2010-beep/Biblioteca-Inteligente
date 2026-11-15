import { GoogleGenAI, Type } from '@google/genai';
import type { Book, BookAnalysis, BookRecommendation } from '../src/types/library.ts';

const MODEL_NAME = 'gemini-4-hydrogen';

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'A variável GEMINI_API_KEY não está configurada no servidor. Verifique o painel Settings > Secrets.'
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function summarizeLibraryContext(books: Book[]): string {
  if (books.length === 0) {
    return 'O acervo do usuário ainda está vazio.';
  }

  const labels: Record<Book['category'], string> = {
    quero_ler: 'Quero Ler',
    lendo: 'Lendo',
    concluido: 'Concluído',
  };

  return books
    .map((book) => {
      const progress =
        book.totalPages > 0 ? `${Math.round((book.currentPage / book.totalPages) * 100)}%` : '0%';
      const ratingText = book.rating > 0 ? `${book.rating}/5 estrelas` : 'sem avaliação';
      const reviewText = book.review ? ` | Resenha: "${book.review}"` : '';
      return `- "${book.title}" de ${book.author} (ISBN: ${book.isbn || 'N/A'}, Gênero: ${book.genre}, Status: ${labels[book.category]}, Progresso: ${book.currentPage}/${book.totalPages} págs [${progress}], Avaliação: ${ratingText}${reviewText})`;
    })
    .join('\n');
}

export function formatGeminiError(error: unknown): { status: number; message: string } {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('GEMINI_API_KEY')) {
    return { status: 503, message: raw };
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
    return {
      status: 403,
      message:
        'Chave da API Gemini inválida ou sem permissão. Verifique a chave configurada em Settings > Secrets.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message:
        'Limite gratuito de requisições atingido temporariamente. Aguarde alguns segundos e tente novamente.',
    };
  }
  return {
    status: 500,
    message: `Não foi possível consultar o assistente literário: ${raw}`,
  };
}

export async function chatWithLibrarian(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  libraryBooks: Book[]
): Promise<string> {
  const ai = getClient();
  const libraryContext = summarizeLibraryContext(libraryBooks);

  const systemInstruction = [
    'Você é o Curador Literário da plataforma "Biblioteca Inteligente".',
    'Responda sempre em português do Brasil (pt-BR), com clareza, profundidade literária e tom acolhedor.',
    'Suas capacidades principais:',
    '1. Conversar sobre livros, movimentos literários, estilos narrativos e adaptações.',
    '2. Recomendar leituras personalizadas usando o acervo e as avaliações reais do usuário.',
    '3. Explicar personagens, temas, acontecimentos importantes e conceitos filosóficos ou históricos das obras (evite spoilers pesados caso o usuário esteja na categoria "Lendo" ou "Quero Ler", a menos que ele peça explicitamente).',
    'Formate respostas com parágrafos curtos e listas objetivas quando útil.',
    '',
    'Acervo atual do usuário:',
    libraryContext,
  ].join('\n');

  const conversationText = history
    .slice(-12)
    .map((m) => `${m.role === 'user' ? 'Leitor' : 'Curador'}: ${m.content}`)
    .join('\n\n');

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: conversationText,
    config: {
      systemInstruction,
    },
  });

  return (response.text ?? 'Não consegui formular uma resposta agora. Tente reformular sua pergunta.').trim();
}

export async function analyzeBookWithAI(book: Book, focus?: string): Promise<BookAnalysis> {
  const ai = getClient();

  const focusInstruction = focus
    ? `Foque especialmente neste pedido do leitor: "${focus}".`
    : 'Forneça uma análise clara e didática sem estragar surpresas finais se o livro ainda estiver em leitura.';

  const statusLabel =
    book.category === 'concluido' ? 'Concluído' : book.category === 'lendo' ? 'Lendo agora' : 'Quero Ler';

  const prompt = [
    `Analise o livro "${book.title}" de ${book.author} (Gênero: ${book.genre}, Ano: ${book.year ?? 'N/A'}, Status do leitor: ${statusLabel}, Página atual: ${book.currentPage}/${book.totalPages}).`,
    book.synopsis ? `Sinopse cadastrada: ${book.synopsis}` : '',
    focusInstruction,
    'Responda estritamente em português do Brasil seguindo o schema JSON.',
  ]
    .filter(Boolean)
    .join('\n');

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction:
        'Você é um especialista em literatura e análise de obras. Explique personagens, temas, acontecimentos e conceitos de forma acessível e precisa em português do Brasil.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          resumo: {
            type: Type.STRING,
            description: 'Contexto geral da obra e sua relevância literária em 2 a 3 frases.',
          },
          personagens: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                nome: { type: Type.STRING },
                papel: { type: Type.STRING },
              },
              required: ['nome', 'papel'],
            },
          },
          temas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          acontecimentosChave: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          conceitosLiterarios: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['resumo', 'personagens', 'temas', 'acontecimentosChave', 'conceitosLiterarios'],
      },
    },
  });

  const parsed = JSON.parse((response.text ?? '{}').trim()) as BookAnalysis;
  return parsed;
}

export async function generateRecommendations(
  libraryBooks: Book[],
  interest?: string
): Promise<BookRecommendation[]> {
  const ai = getClient();
  const libraryContext = summarizeLibraryContext(libraryBooks);

  const prompt = [
    'Com base no acervo do leitor abaixo, recomende 4 livros que ele ainda NÃO tenha na lista.',
    interest ? `Interesse ou humor atual informado pelo leitor: "${interest}".` : '',
    'Acervo do leitor:',
    libraryContext,
    'Retorne títulos reais e conhecidos (em português sempre que houver edição consolidada no Brasil), ISBN-13 provável ou vazio se incerto, gênero, páginas estimadas e uma justificativa personalizada ligando a indicação às leituras dele.',
  ]
    .filter(Boolean)
    .join('\n');

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: 'Você é um curador editorial que recomenda livros reais com precisão em pt-BR.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            isbn: { type: Type.STRING },
            genre: { type: Type.STRING },
            estimatedPages: { type: Type.INTEGER },
            reason: { type: Type.STRING },
          },
          required: ['title', 'author', 'isbn', 'genre', 'estimatedPages', 'reason'],
        },
      },
    },
  });

  const parsed = JSON.parse((response.text ?? '[]').trim()) as BookRecommendation[];
  return Array.isArray(parsed) ? parsed : [];
}
