# Analytics (Google Analytics 4)

BetterHermosa uses Google Analytics 4 to count visits. The tag is an inline script in `index.html`, so every page, including the prerendered ones, carries it.

| Item | Value |
| --- | --- |
| GA account / property | BetterHermosa / betterhermosa.org (owner: ialexies@gmail.com) |
| Measurement ID | `G-0SF4GBTB2Y` (public, it is visible in the page source) |
| Time zone / currency | Philippines / PHP |

## How it works

- The tag loads only when `location.hostname` is `betterhermosa.org`, so local development and Cloudflare preview URLs are not counted.
- The site is a single-page app. GA4 "Enhanced measurement" has "Page changes based on browser history events" on, so moving between pages is counted as a page view without extra code.
- Enhanced measurement also records outbound clicks. A click on the Jinboway "Open the form in a new tab" button is logged as a `click` event to `docs.google.com`.
- Google signals and ad personalisation are switched off in the tag. All four data-sharing options on the GA account were left unticked.
- GA never sees what people type into the Jinboway registration form. That form is Google Forms, outside this site.

## Reading the numbers

Reports appear in analytics.google.com. Real-time shows within minutes; standard reports take up to 48 hours.

- Visits to the Jinboway page: Reports, Engagement, Pages and screens, filter on `/tulong-jinboway`.
- Clicks to the form: Reports, Engagement, Events, `click` with `link_domain` `docs.google.com`.
- Shares: the Share menu on the Jinboway page sends a GA4 `share` event with `method` (copy_link, native, facebook, viber, whatsapp, telegram, x, linkedin, email, qr_code). Reports, Engagement, Events, `share`. It only records that a share happened, not who shared or with whom.
- Registrations: when someone sends the form, the page detects it and sends a GA4 `generate_lead` event (`method` = google_form). It counts submissions (including repeats), not who sent them. Reports, Engagement, Events, `generate_lead`.
- Visits only count people whose browser lets the tag load. Ad blockers and "Do Not Track" extensions hide some visitors, so treat the numbers as a floor.

## Privacy

Google Analytics sets cookies and sends visit data to Google. Visitors should be told. This repo has no privacy page yet, so add one (or a footer line) and have the municipality's data protection officer read it, because RA 10173 applies.

## Changing or removing it

Edit or delete the script block in `index.html`. Prerender copies it into every page at build time, so no other file needs to change.
