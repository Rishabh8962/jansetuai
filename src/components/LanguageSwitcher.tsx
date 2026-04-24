import { Languages } from 'lucide-react';
import { useLang } from '@/i18n/LanguageContext';
import { LANG_LABELS, type Lang } from '@/i18n/translations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full glass-card border-border/60 text-xs font-medium hover:border-primary/40 transition-colors"
          aria-label={t('lang.label', 'Language')}
        >
          <Languages className="w-3.5 h-3.5 text-primary" />
          {!compact && <span>{LANG_LABELS[lang]}</span>}
          {compact && <span className="uppercase">{lang}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLang(l)}
            className={l === lang ? 'bg-primary/10 text-primary font-medium' : ''}
          >
            {LANG_LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
