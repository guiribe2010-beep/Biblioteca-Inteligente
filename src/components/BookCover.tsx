import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  src?: string;
  title: string;
  author: string;
  className?: string;
}

export function BookCover({ src, title, author, className = '' }: BookCoverProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`relative flex flex-col justify-between overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-[#1E2320] via-[#171A18] to-[#121413] p-4 ${className}`}
      >
        <div className="flex items-center justify-between text-[#8FA893]/70">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span className="font-mono-tabular text-[10px] tracking-wider uppercase text-[#7C8680]">
            Edição
          </span>
        </div>
        <div className="my-auto py-2">
          <p className="font-display text-base font-medium leading-snug text-[#ECEEEB] line-clamp-3">
            {title}
          </p>
          <p className="mt-1.5 text-xs text-[#9CA39E] line-clamp-2">{author}</p>
        </div>
        <div className="h-px w-10 bg-[#8FA893]/40" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-white/10 bg-[#1A1D1B] ${className}`}>
      <img
        src={src}
        alt={`Capa de ${title}`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
