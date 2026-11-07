import { FC, useState } from 'react';

import { Link } from 'react-router-dom';

import { ArrowRightIcon, HeartHandshakeIcon, XIcon } from 'lucide-react';

import { jinbowayStatus } from '@/lib/jinboway';

const KEY = 'jinboway-banner-dismissed';

const wasDismissed = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

const AssistanceBanner: FC = () => {
  const [hidden, setHidden] = useState(wasDismissed);
  const { ready } = jinbowayStatus();

  if (!ready || hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // storage can be blocked; the notice is simply hidden for this visit
    }
  };

  return (
    <div
      role='region'
      aria-label='Tulong para sa mga taga-Hermosa na naapektuhan ng sunog sa mga pabrika at bodega sa Subic'
      className='bg-kapwa-bg-warning-default text-kapwa-text-strong'
    >
      <div className='container mx-auto flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <HeartHandshakeIcon
            aria-hidden='true'
            className='mt-0.5 h-5 w-5 shrink-0'
          />
          <p className='text-sm leading-snug font-bold'>
            Taga-Hermosa na naapektuhan ng sunog sa mga pabrika at bodega sa
            Subic? Magparehistro dito.
            <span className='block font-normal'>
              Hermosa resident affected by the fire at factories and warehouses
              in Subic? Register here.
            </span>
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Link
            to='/tulong-jinboway'
            className='bg-kapwa-bg-surface-bold text-kapwa-text-inverse inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold whitespace-nowrap sm:flex-none'
          >
            Fill up the form
            <ArrowRightIcon aria-hidden='true' className='h-4 w-4' />
          </Link>
          <button
            type='button'
            onClick={dismiss}
            aria-label='Itago ang paalalang ito / Hide this notice'
            className='inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full'
          >
            <XIcon aria-hidden='true' className='h-5 w-5' />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistanceBanner;
