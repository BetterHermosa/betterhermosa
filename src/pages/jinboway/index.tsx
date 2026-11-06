import { FC } from 'react';

import {
  AlertTriangleIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
} from 'lucide-react';

import { SEO } from '@/components/layout/SEO';

import { embedUrl, jinboway, jinbowayStatus } from '@/lib/jinboway';

const Section: FC<{ title: string; en: string; children: React.ReactNode }> = ({
  title,
  en,
  children,
}) => (
  <section className='border-kapwa-border-weak bg-kapwa-bg-surface space-y-3 rounded-2xl border p-4 sm:p-6'>
    <div>
      <h2 className='text-kapwa-text-strong text-lg font-black'>{title}</h2>
      <p className='text-kapwa-text-support text-sm'>{en}</p>
    </div>
    {children}
  </section>
);

const JinbowayPage: FC = () => {
  const { ready, closed, formUrl } = jinbowayStatus();
  const who = `${jinboway.collector.title} ${jinboway.collector.name}`.trim();
  const recipients = jinboway.recipients.join(', ');

  return (
    <div className='container mx-auto max-w-3xl space-y-6 px-4 pt-8 pb-20'>
      <SEO
        title='Tulong para sa mga taga-Bataan na apektado ng sunog sa Jinboway | BetterHermosa'
        description='Pagpaparehistro ng mga taga-Bataan na nagtatrabaho sa Jinboway at apektado ng sunog. Registration for Bataan residents working at Jinboway.'
        ogImage='/logos/png/jinboway-og.png'
        noIndex
      />

      <header className='space-y-2'>
        <h1 className='text-kapwa-text-strong text-2xl leading-tight font-black sm:text-3xl'>
          Tulong para sa mga taga-Bataan na apektado ng sunog sa Jinboway
        </h1>
        <p className='text-kapwa-text-support'>
          Help for Bataan residents affected by the Jinboway fire
        </p>
      </header>

      {!ready ? (
        <Section
          title={
            closed ? 'Sarado na ang form na ito.' : 'Hindi pa bukas ang form.'
          }
          en={
            closed
              ? 'This form is closed.'
              : 'The form is not open yet. Please check back soon.'
          }
        >
          <p className='text-kapwa-text-support text-sm'>
            Salamat sa pang-unawa. / Thank you for your patience.
          </p>
        </Section>
      ) : (
        <>
          <Section title='Ano ito?' en='What is this?'>
            <p className='text-kapwa-text-strong text-sm leading-relaxed'>
              Si {who} ay nangangalap ng impormasyon ng mga manggagawang
              naapektuhan ng sunog sa Jinboway upang makahingi ng tulong sa{' '}
              {recipients}. Hindi ito garantiya ng tulong.
            </p>
            <p className='text-kapwa-text-support text-sm leading-relaxed'>
              {who} is collecting information from workers affected by the
              Jinboway fire in order to ask for help from {recipients}. Filling
              in the form does not guarantee assistance.
            </p>
            <p className='text-kapwa-text-strong border-kapwa-border-brand border-l-4 pl-3 text-sm leading-relaxed font-bold'>
              Para ito sa mga residente ng Bataan na nagtatrabaho sa Jinboway,
              dahil taga-Bataan ang mga opisyal na hihingan ng tulong.
              <span className='text-kapwa-text-support block font-normal'>
                This initiative is for Bataan residents who work at Jinboway,
                because the officials we are asking for help are from Bataan.
              </span>
            </p>
          </Section>

          <div
            role='note'
            className='border-kapwa-border-warning bg-kapwa-bg-warning-weak text-kapwa-text-strong flex gap-3 rounded-2xl border p-4 text-sm'
          >
            <AlertTriangleIcon
              aria-hidden='true'
              className='mt-0.5 h-5 w-5 shrink-0'
            />
            <div className='space-y-1'>
              <p className='font-bold'>
                Libre ito. Walang bayad. Huwag magbigay ng OTP, PIN o bank
                details kaninuman.
              </p>
              <p>
                This is free. Never give anyone an OTP, PIN or bank details. Do
                not post your personal details in Facebook comments. Use only
                this link.
              </p>
            </div>
          </div>

          <Section title='Ihanda' en='Please have ready'>
            <ul className='text-kapwa-text-strong list-disc space-y-1 pl-5 text-sm'>
              <li>Apelyido, pangalan at gitnang pangalan / Full name</li>
              <li>Petsa ng kapanganakan / Birthdate</li>
              <li>Tirahan at barangay / Address and barangay</li>
              <li>Contact number</li>
              <li>Benepisyaryo (sino ang tatanggap ng tulong) / Beneficiary</li>
              <li>Posisyon sa Jinboway / Designation</li>
              <li>
                Jinboway company ID number (HUWAG ang SSS, PhilHealth, TIN o
                national ID / NOT SSS, PhilHealth, TIN or national ID)
              </li>
            </ul>
          </Section>

          <Section title='Privacy' en='Data Privacy Act of 2012'>
            <div className='text-kapwa-text-support flex gap-3 text-sm leading-relaxed'>
              <ShieldCheckIcon
                aria-hidden='true'
                className='mt-0.5 h-5 w-5 shrink-0'
              />
              <div className='space-y-2'>
                <p>
                  Kinokolekta ni {who} ang iyong impormasyon para i-verify at
                  i-coordinate ang tulong. Ibabahagi ito sa {recipients}.
                  Itatago lamang hangga&rsquo;t kailangan at buburahin
                  pagkatapos. Para magtanong, magtama o magpabura:{' '}
                  {jinboway.collector.contact}.
                </p>
                <p>
                  {who} collects your information to verify it and coordinate
                  help, and shares it with {recipients}. It is kept only as long
                  as needed, then deleted. To ask questions, correct or delete
                  your data: {jinboway.collector.contact}.
                </p>
              </div>
            </div>
          </Section>

          <Section
            title='Form'
            en={`Bukas hanggang / Open until ${jinboway.closesOn}`}
          >
            <a
              href={formUrl ?? undefined}
              target='_blank'
              rel='noopener noreferrer'
              className='bg-kapwa-bg-brand-default text-kapwa-text-inverse inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold sm:w-auto'
            >
              Buksan sa bagong tab / Open the form in a new tab
              <ExternalLinkIcon aria-hidden='true' className='h-4 w-4' />
            </a>
            <iframe
              title='Registration form / Form ng pagpaparehistro'
              src={embedUrl(formUrl!)}
              sandbox='allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox'
              referrerPolicy='no-referrer'
              loading='lazy'
              className='border-kapwa-border-weak h-[4900px] w-full rounded-xl border sm:h-[3500px]'
            />
          </Section>
        </>
      )}

      <p className='text-kapwa-text-support text-xs leading-relaxed'>
        Ang BetterHermosa ay malayang community website at hindi website ng
        pamahalaan. Hindi nito natatanggap o iniimbak ang impormasyong isusumite
        mo. / BetterHermosa is an independent community site and is not a
        government website. It does not receive or store the information you
        submit.
      </p>
    </div>
  );
};

export default JinbowayPage;
