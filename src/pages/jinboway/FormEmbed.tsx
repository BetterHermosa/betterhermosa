import { FC, useEffect, useRef, useState } from 'react';

import { CheckCircle2Icon, RotateCcwIcon } from 'lucide-react';

import { embedUrl } from '@/lib/jinboway';

interface FormEmbedProps {
  formUrl: string;
}

const trackSubmit = () => {
  try {
    const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void })
      .gtag;
    gtag?.('event', 'generate_lead', { method: 'google_form' });
  } catch {
    // analytics must never break the form
  }
};

// The Google Form is cross-origin, so we cannot read it. It loads once; sending the form
// loads Google's confirmation page in the same frame, which is the second load.
export const FormEmbed: FC<FormEmbedProps> = ({ formUrl }) => {
  const [loads, setLoads] = useState(0);
  const [round, setRound] = useState(0);
  const notice = useRef<HTMLDivElement>(null);
  const submitted = loads >= 2;

  useEffect(() => {
    if (!submitted) return;
    trackSubmit();
    const reduce = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    notice.current?.scrollIntoView({
      block: 'start',
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [submitted]);

  const registerAnother = () => {
    setLoads(0);
    setRound(r => r + 1);
  };

  return (
    <div className='space-y-3'>
      {submitted && (
        <div
          ref={notice}
          role='status'
          className='border-kapwa-border-success bg-kapwa-bg-success-weak text-kapwa-text-strong scroll-mt-24 space-y-3 rounded-2xl border p-4 text-sm'
        >
          <div className='flex gap-3'>
            <CheckCircle2Icon
              aria-hidden='true'
              className='mt-0.5 h-5 w-5 shrink-0'
            />
            <div className='space-y-1'>
              <p className='font-bold'>
                Naipadala na ang iyong form. Huwag nang mag-submit ulit maliban
                kung may itatama.
              </p>
              <p>
                Your form was sent. Please do not submit again unless you need
                to correct something.
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={registerAnother}
            className='border-kapwa-border-weak bg-kapwa-bg-surface text-kapwa-text-strong inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-5 text-sm font-bold sm:w-auto'
          >
            <RotateCcwIcon aria-hidden='true' className='h-4 w-4' />
            Mag-register ng ibang tao / Register another person
          </button>
        </div>
      )}
      <iframe
        key={round}
        title='Registration form / Form ng pagpaparehistro'
        src={embedUrl(formUrl)}
        sandbox='allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox'
        referrerPolicy='no-referrer'
        loading='lazy'
        onLoad={() => setLoads(n => n + 1)}
        className={`border-kapwa-border-weak w-full rounded-xl border ${
          submitted ? 'h-[360px]' : 'h-[4900px] sm:h-[3500px]'
        }`}
      />
    </div>
  );
};
