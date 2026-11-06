import data from '@/data/jinboway.json';

export const jinboway = data;

const FORM_HOSTS = ['docs.google.com', 'forms.gle'];

// Only Google Forms links are ever embedded or opened from this page.
export function safeFormUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || !FORM_HOSTS.includes(u.hostname))
      return null;
    if (u.hostname === 'docs.google.com' && !u.pathname.startsWith('/forms/')) {
      return null;
    }
    return u.toString();
  } catch {
    return null;
  }
}

export function embedUrl(url: string): string {
  const u = new URL(url);
  u.searchParams.set('embedded', 'true');
  return u.toString();
}

// The form counts as open only when every public detail is filled in, so an
// incomplete page can never go live by accident.
export function jinbowayStatus(now: Date = new Date()): {
  ready: boolean;
  closed: boolean;
  formUrl: string | null;
} {
  const formUrl = safeFormUrl(data.formUrl);
  const complete =
    Boolean(formUrl) &&
    Boolean(data.collector.name.trim()) &&
    Boolean(data.collector.title.trim()) &&
    Boolean(data.collector.contact.trim()) &&
    /^\d{4}-\d{2}-\d{2}$/.test(data.closesOn);
  const pastClose =
    /^\d{4}-\d{2}-\d{2}$/.test(data.closesOn) &&
    now.getTime() > new Date(`${data.closesOn}T23:59:59+08:00`).getTime();
  const closed = !data.open || pastClose;
  return { ready: complete && !closed, closed, formUrl };
}
