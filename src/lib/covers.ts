import coverDomCasmurro from '../assets/images/cover_dom_casmurro_1794765206649.jpg';
import coverDuna from '../assets/images/cover_duna_1794765206786.jpg';
import cover1984 from '../assets/images/cover_1984_1794765207462.jpg';
import coverHoraEstrela from '../assets/images/cover_hora_estrela_1794765207337.jpg';
import type { Book } from '../types/library';

const BUNDLED_COVERS: Record<NonNullable<Book['coverKey']>, string> = {
  dom_casmurro: coverDomCasmurro,
  duna: coverDuna,
  '1984': cover1984,
  hora_estrela: coverHoraEstrela,
};

export function resolveBookCover(book: Pick<Book, 'coverKey' | 'coverUrl'>): string | undefined {
  if (book.coverKey && BUNDLED_COVERS[book.coverKey]) {
    return BUNDLED_COVERS[book.coverKey];
  }
  return book.coverUrl || undefined;
}
