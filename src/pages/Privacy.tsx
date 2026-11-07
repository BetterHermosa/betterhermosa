import { FC } from 'react';

import { Link } from 'react-router-dom';

import { SEO } from '@/components/layout/SEO';

import { config } from '@/lib/lguConfig';

const Section: FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className='border-kapwa-border-weak bg-kapwa-bg-surface space-y-2 rounded-2xl border p-4 sm:p-6'>
    <h2 className='text-kapwa-text-strong text-lg font-black'>{title}</h2>
    <div className='text-kapwa-text-support space-y-2 text-sm leading-relaxed'>
      {children}
    </div>
  </section>
);

const Privacy: FC = () => (
  <div className='container mx-auto max-w-3xl space-y-6 px-4 pt-8 pb-20'>
    <SEO />

    <header className='space-y-2'>
      <h1 className='text-kapwa-text-strong text-2xl leading-tight font-black sm:text-3xl'>
        Privacy
      </h1>
      <p className='text-kapwa-text-support'>
        Ano ang kinokolekta ng {config.portal.name} at ano ang hindi. / What{' '}
        {config.portal.name} collects and what it does not.
      </p>
    </header>

    <Section title='Visit statistics (Google Analytics)'>
      <p>
        Ang site na ito ay gumagamit ng Google Analytics para bilangin ang mga
        bumibisita at alamin kung aling mga pahina ang nababasa. Gumagamit ito
        ng cookies at nagpapadala ng impormasyon ng pagbisita (halimbawa ang
        pahina, uri ng device at humigit-kumulang na lokasyon) sa Google. Hindi
        namin ginagamit ito para kilalanin ka.
      </p>
      <p>
        This site uses Google Analytics to count visits and see which pages are
        read. It uses cookies and sends visit information (for example the page,
        device type and approximate location) to Google. We do not use it to
        identify you. Google signals and ad personalisation are switched off.
      </p>
      <p>
        Para tumanggi, i-block ang cookies o gumamit ng ad blocker, o i-install
        ang{' '}
        <a
          href='https://tools.google.com/dlpage/gaoptout'
          target='_blank'
          rel='noopener noreferrer'
          className='text-kapwa-text-brand font-bold'
        >
          Google Analytics opt-out add-on
        </a>
        . / To opt out, block cookies, use an ad blocker, or install the Google
        Analytics opt-out add-on above. The site works the same either way.
      </p>
    </Section>

    <Section title='What we do not collect'>
      <p>
        Walang account o login. Hindi kami humihingi ng pangalan, address o
        contact number sa mga pahina ng site na ito. / There are no accounts or
        logins, and the pages of this site do not ask for your name, address or
        contact number.
      </p>
    </Section>

    <Section title='Forms run by others'>
      <p>
        Ang ilang pahina ay may link o naka-embed na form ng Google Forms,
        halimbawa ang{' '}
        <Link
          to='/tulong/subic-fire'
          className='text-kapwa-text-brand font-bold'
        >
          pagpaparehistro para sa tulong
        </Link>{' '}
        kung bukas pa. Ang impormasyong isinusumite roon ay napupunta sa taong
        nangongolekta nito at hindi natatanggap o iniimbak ng{' '}
        {config.portal.name}. Basahin ang privacy notice sa mismong form. / Some
        pages link to or embed a Google Form. What you submit there goes to the
        person collecting it and is not received or stored by{' '}
        {config.portal.name}. Read the privacy notice on that form.
      </p>
    </Section>

    <Section title='About this site'>
      <p>
        Ang {config.portal.name} ay malayang community website na pinatatakbo ng
        mga boluntaryo at hindi website ng pamahalaan. / {config.portal.name} is
        an independent community site run by volunteers and is not a government
        website.
      </p>
      <p>
        Mga tanong o hiling na tanggalin ang impormasyon: / Questions or removal
        requests:{' '}
        <Link to='/contact' className='text-kapwa-text-brand font-bold'>
          Contact
        </Link>
        .
      </p>
    </Section>
  </div>
);

export default Privacy;
