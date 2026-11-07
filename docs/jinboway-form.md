# Jinboway fire: assistance registration form

A short-lived way for workers affected by the Jinboway fire to register their details so Councilor Elvin Iglesia's office can ask Cong. Tonyboy Roman, Mayor Anne Lorraine Adorable-Inton and PESO Hermosa for help.

**Who it is for:** residents of **Hermosa, Bataan** who work at Jinboway, because the offices being asked for help (Cong. Tonyboy Roman, Mayor Anne Lorraine Adorable-Inton, PESO Hermosa) serve Hermosa. The form notice, the page and the home notice all say so. The form enforces what a web form can: the barangay question lists only Hermosa's 23 barangays (there is no "other town" option), the address help text says Hermosa, Bataan, and a required box says "I live in Hermosa, Bataan and I work at Jinboway". It cannot stop someone from ticking it falsely, so the offices still check residency and employment against the address, barangay and company ID when they verify each entry.

**BetterHermosa never receives or stores the answers.** The form is a Google Form owned by the Councilor's Google account. Answers go to a private Google Sheet in that account. The site only has a page that explains the form and embeds it, and a notice on the home page that links to that page.

## Pieces

| Piece | Where |
| --- | --- |
| Script that builds the form, the response sheet and the safeguards | `scripts/forms/jinboway-form.gs` |
| Page (not in the menu, `noindex`, not in the sitemap or `llms.txt`) | `/tulong-jinboway`, `src/pages/jinboway/index.tsx` |
| Notice on the home page | `src/components/home/AssistanceBanner.tsx` |
| The one place that opens and closes everything | `src/data/jinboway.json` |

## Opening the form (before it goes public)

1. **Get from the Councilor:** his exact title (he is not one of the 8 municipal councilors listed on hermosa.gov.ph, so do not call him a municipal councilor), a contact number or Messenger link for questions and removal requests, his go-ahead to publish, and the closing date.
2. **Build the form.** Signed in to the Google account that should own the data, open https://script.google.com, paste `scripts/forms/jinboway-form.gs`, fill in the `CONFIG` block (`collectorTitle`, `contact`, `closesOn`, optional `alertEmail`), choose `createJinbowayForm`, press Run, and approve the access request. The execution log prints three links: the **public form** link (the only one to share), the **edit** link and the **responses sheet** (both private).
3. **Lock down the sheet** (see Security below) and **send a test entry** with fake data. Delete it afterwards.
4. **Open the page.** In `src/data/jinboway.json` set `formUrl` (the public link), `collector.title`, `collector.contact`, `closesOn` (`YYYY-MM-DD`) and `open` to `true`, then open a PR. The page and the home notice only appear when `open` is true, every detail above is filled in, `formUrl` is a Google Forms link, and the closing date has not passed. An incomplete file can never go live.
5. After the page is live, check the embedded form's height on a phone. The real form is about 4,800px tall at phone width and 3,200px on desktop, and the frame is sized to match (`h-[4900px] sm:h-[3500px]` in `src/pages/jinboway/index.tsx`); if you add fields or text to the form, remeasure and adjust. The "Open the form in a new tab" button is the fallback.
6. The Councilor posts **one** official link from his own Facebook account, and edits the post to say: do not post details in the comments, use the form, it is free, never give an OTP, PIN or bank details.

## What the form asks

Surname, first name, middle name, birthdate, address, barangay or town, contact number, beneficiary (the person who will receive the aid; SELF if the worker), designation at Jinboway, the Jinboway company or employee ID (company ID only, never SSS, PhilHealth, TIN or national ID numbers), an optional department or supervisor, a consent box, and a human check. No email, no uploads.

## Spam safeguards (installed by the script)

Google Forms has no CAPTCHA, so these make careless and automated spam hard; they do not stop someone typing fake entries by hand.

- **Human check:** the person must type a fixed word in capitals (`HERMOSA` by default).
- **Phone format check** on the form.
- **Circuit breaker:** every 5 minutes the script counts new answers. More than `breakerLimit` (40) in 5 minutes closes the form and emails `alertEmail` with the count only, never personal data. After checking the Review tab, run `reopenForm`.
- **Review tab:** formulas (the raw answers are never edited) flag duplicate phone numbers, duplicate person (name and birthdate), duplicate company IDs, bad phone formats and suspicious names, plus a column for the offices to mark "YES" when verified.
- **Auto-close** at the closing date.
- **Optional:** `requireGoogleSignIn: true` allows one answer per Google account, which cuts spam more but excludes people without a Google account and records their email.
- **Verify before helping:** the offices match names and company IDs against the employer's list or PESO's own checks. This is the real control against fake entries.

## Security

- The owner Google account has 2-step verification on and a strong unique password that nobody else is given.
- Share the sheet and form only with named people by email: Viewer for PESO and the other offices, Editor for the Councilor and one named staff member. Never "anyone with the link"; check by opening the sheet link in a private window, which must ask for access.
- In the form's Responses tab, leave "Get email notifications for new responses" off.
- Never put the edit link or the sheet link in the repo, Facebook or a group chat.
- When passing data on, give offices Viewer access or a password-protected file (password sent separately). Do not post it in group chats or email plain spreadsheets.
- The confirmation message and the page promise no aid and no amount. The notice says it is free and warns against OTP, PIN and bank detail scams.
- Data Privacy Act of 2012 (RA 10173): the Councilor's office decides what is collected and why, so it is responsible for the notice and the data. Have the municipal data protection officer, if there is one, read the notice. This project is not legal advice.

## Lessons from the first run

- Google only allows `setRequireLogin` on Workspace accounts; on a regular Gmail account it throws "This operation is not supported". The script now only sets sign-in options when `requireGoogleSignIn` is true. A run that fails after `FormApp.create` leaves an empty form behind in Drive: delete it.
- Google Forms inserts each new response above the old row 2 of the response sheet, so a Review formula that reads `A2:A` silently shifts to `A3:A` after the first response. The Review tab reads whole columns instead.
- Inside `ARRAYFORMULA`, `OR()` combines every row into one answer; the name check uses arithmetic instead.
- Both fixes were checked with two identical fake test entries: the first showed no flags, and after the second both rows were flagged as duplicate phone, duplicate person and duplicate company ID.
- After pasting a newer version of the script over an existing project, run `updateNotice` to rewrite only the form's notice text. `applyFixes` does that and also rebuilds the Review tab, which clears the "Verified by offices" column, so avoid it once the offices have started marking entries.
- The embedded form shows a "Sign in to Google to save your progress" line. That is Google's own and cannot be removed; signing in is optional.

## Closing and cleanup

1. Set `"open": false` in `src/data/jinboway.json` and merge: the home notice disappears and the page says the form is closed. (The form also closes itself at `closesOn`.)
2. When the offices have what they need, export what must be handed over, then delete the responses (or the form and the sheet) and run `removeAllTriggers`.
3. Remove the page, the notice and the script in a later PR if you do not expect to reuse them.

## Notes

- The page is prerendered with `noindex` so a Facebook share shows a proper title, but search engines are told not to list it. The route carries `noSitemap` and `noindex` flags in `scripts/lib/routes.cjs`.
- **Search and share metadata:** the title ("Tulong para sa mga taga-Bataan na apektado ng sunog sa Jinboway | BetterHermosa"), the H1 and the prerendered H1 all start with the same text, the description is under 160 characters and says it is for Bataan residents, and the page has its own share card (1800x945, with the same artwork as the image at the top of the page, `public/logos/jinboway-help.jpg`) (`public/logos/png/jinboway-og.png`) so a Facebook post shows a clear preview. The route sets `ogImage` in `scripts/lib/routes.cjs` and the prerender writes `og:image` and `twitter:image` from it. The page stays `noindex` and out of the sitemap on purpose: it is a short-lived page that collects no data itself. If you want Google to list it, remove `noindex` from `src/pages/jinboway/index.tsx` and the route in `scripts/lib/routes.cjs`, and drop `noSitemap` if it should be in the sitemap; consider taking it down again when the form closes.
- I could not find news coverage of the fire when preparing this, so the wording says only "workers affected by the Jinboway fire", as stated by the Councilor, and states no facts or numbers about it.
