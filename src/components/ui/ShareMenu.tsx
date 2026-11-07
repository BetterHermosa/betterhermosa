import {
  FC,
  ReactNode,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  SiFacebook,
  SiTelegram,
  SiViber,
  SiWhatsapp,
  SiX,
} from '@icons-pack/react-simple-icons';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  CheckIcon,
  LinkIcon,
  LinkedinIcon,
  MailIcon,
  QrCodeIcon,
  Share2Icon,
  SmartphoneIcon,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

const QrImage = lazy(() => import('./ShareQr'));

interface ShareMenuProps {
  url: string;
  title: string;
  text?: string;
  className?: string;
}

type Status = 'idle' | 'copied' | 'failed';

const trackShare = (method: string, url: string) => {
  try {
    const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void })
      .gtag;
    gtag?.('event', 'share', { method, content_type: 'page', item_id: url });
  } catch {
    // analytics must never break sharing
  }
};

const itemClass =
  'text-kapwa-text-strong data-[highlighted]:bg-kapwa-bg-hover flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm outline-none select-none';

export const ShareMenu: FC<ShareMenuProps> = ({
  url,
  title,
  text,
  className,
}) => {
  const [status, setStatus] = useState<Status>('idle');
  const [qrOpen, setQrOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const message = `${text ?? title} ${url}`;
  const enc = encodeURIComponent;

  const targets: {
    key: string;
    label: string;
    icon: ReactNode;
    href: string;
  }[] = [
    {
      key: 'facebook',
      label: 'Facebook',
      icon: <SiFacebook className='h-4 w-4' />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
    {
      key: 'viber',
      label: 'Viber',
      icon: <SiViber className='h-4 w-4' />,
      href: `viber://forward?text=${enc(message)}`,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: <SiWhatsapp className='h-4 w-4' />,
      href: `https://wa.me/?text=${enc(message)}`,
    },
    {
      key: 'telegram',
      label: 'Telegram',
      icon: <SiTelegram className='h-4 w-4' />,
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text ?? title)}`,
    },
    {
      key: 'x',
      label: 'X (Twitter)',
      icon: <SiX className='h-4 w-4' />,
      href: `https://twitter.com/intent/tweet?text=${enc(text ?? title)}&url=${enc(url)}`,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: <LinkedinIcon className='h-4 w-4' />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    },
    {
      key: 'email',
      label: 'Email',
      icon: <MailIcon className='h-4 w-4' />,
      href: `mailto:?subject=${enc(title)}&body=${enc(message)}`,
    },
  ];

  const flash = (s: Status) => {
    setStatus(s);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus('idle'), 3000);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      trackShare('copy_link', url);
      flash('copied');
    } catch (error) {
      console.error('share.copy_failed', error);
      flash('failed');
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: text ?? title, url });
      trackShare('native', url);
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        console.error('share.native_failed', error);
        flash('failed');
      }
    }
  };

  const openTarget = (key: string, href: string) => {
    trackShare(key, url);
    if (key === 'viber' || key === 'email') {
      window.location.href = href;
    } else {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={className}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type='button'
            className='border-kapwa-border-weak bg-kapwa-bg-surface text-kapwa-text-strong inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-bold'
          >
            <Share2Icon aria-hidden='true' className='h-4 w-4' />
            Ibahagi / Share
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align='start'
            sideOffset={8}
            collisionPadding={16}
            className='border-kapwa-border-weak bg-kapwa-bg-surface z-50 w-60 max-w-[calc(100vw-2rem)] rounded-xl border p-1.5 shadow-lg'
          >
            {canNativeShare && (
              <DropdownMenu.Item className={itemClass} onSelect={nativeShare}>
                <SmartphoneIcon aria-hidden='true' className='h-4 w-4' />
                Share…
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Item
              className={itemClass}
              onSelect={event => {
                event.preventDefault();
                void copyLink();
              }}
            >
              {status === 'copied' ? (
                <CheckIcon aria-hidden='true' className='h-4 w-4' />
              ) : (
                <LinkIcon aria-hidden='true' className='h-4 w-4' />
              )}
              {status === 'copied' ? 'Nakopya na / Copied' : 'Copy link'}
            </DropdownMenu.Item>
            {targets.map(t => (
              <DropdownMenu.Item
                key={t.key}
                className={itemClass}
                onSelect={() => openTarget(t.key, t.href)}
              >
                <span aria-hidden='true'>{t.icon}</span>
                {t.label}
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Item
              className={itemClass}
              onSelect={() => {
                trackShare('qr_code', url);
                setQrOpen(true);
              }}
            >
              <QrCodeIcon aria-hidden='true' className='h-4 w-4' />
              QR code
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <p
        role='status'
        className={
          status === 'failed'
            ? 'text-kapwa-text-danger mt-2 text-sm'
            : 'sr-only'
        }
      >
        {status === 'failed'
          ? 'Hindi makopya ang link. I-copy ito mula sa address bar. / Could not copy the link. Copy it from the address bar.'
          : status === 'copied'
            ? 'Link copied'
            : ''}
      </p>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>QR code</DialogTitle>
            <DialogDescription>
              I-scan gamit ang camera ng phone. / Scan with a phone camera.
            </DialogDescription>
          </DialogHeader>
          <div className='flex justify-center'>
            <Suspense
              fallback={
                <div className='text-kapwa-text-support text-sm'>Loading…</div>
              }
            >
              <QrImage value={url} />
            </Suspense>
          </div>
          <p className='text-kapwa-text-support text-center text-xs break-all'>
            {url}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};
