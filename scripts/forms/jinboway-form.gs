/**
 * Jinboway fire: assistance registration form (Google Apps Script).
 *
 * HOW TO RUN (about 5 minutes), signed in to the Google account that should OWN the data:
 *   1. Open https://script.google.com and press "New project".
 *   2. Delete the sample code and paste this whole file.
 *   3. Fill in the CONFIG block below (every TODO).
 *   4. In the toolbar pick the function  createJinbowayForm  and press Run.
 *      Approve the access request (Forms, Sheets, Mail, triggers). Google shows an
 *      "unverified app" warning for your own script: Advanced > Go to project.
 *   5. Open View > Logs (or Execution log). Copy the three links it prints:
 *        - PUBLIC form link   (the only one to share)
 *        - EDIT link          (keep private)
 *        - RESPONSES sheet    (keep private)
 *   6. Follow docs/jinboway-form.md: share the sheet with named people only, turn off
 *      new-response emails, send a test entry.
 *
 * Other functions you can run later:  showLinks, reopenForm, closeForm, removeAllTriggers.
 *
 * This script contains no secrets. It never makes anything public.
 */

const CONFIG = {
  // Who is collecting. Must be exact: do NOT call someone a municipal councilor unless they are.
  collectorName: 'Elvin Iglesia',
  collectorTitle: 'TODO exact title, e.g. Barangay Tipo Councilor', // required
  // How people can reach the collector with questions or to ask for removal of their data.
  contact: 'TODO phone number or Messenger link', // required
  // Who may receive the data (written in the privacy notice).
  recipients:
    'the offices of Cong. Tonyboy Roman, Mayor Anne Lorraine Adorable-Inton and PESO Hermosa',
  // Last day the form accepts answers (YYYY-MM-DD). It closes at 23:59 Manila time.
  closesOn: 'TODO 2026-MM-DD', // required
  // Circuit-breaker alert goes here (it contains ONLY a count, never personal data).
  // Leave blank to use the account that runs this script.
  alertEmail: '',
  // If more than this many answers arrive within 5 minutes, the form closes itself.
  breakerLimit: 40,
  // true = people must sign in with Google (one answer per account). Stronger against
  // spam, but excludes people without a Google account and records their email.
  requireGoogleSignIn: false,
  // Human check: the exact word people must type (case sensitive).
  humanCheckWord: 'HERMOSA',
};

const BARANGAYS = [
  'A. Rivera (Poblacion)',
  'Almacen',
  'Bacong',
  'Balsic',
  'Bamban',
  'Burgos-Soliman (Poblacion)',
  'Cataning (Poblacion)',
  'Culis',
  'Daungan (Poblacion)',
  'Judge Roman Cruz Sr. (Mandama)',
  'Mabiga',
  'Mabuco',
  'Maite',
  'Mambog-Mandama',
  'Palihan',
  'Pandatung',
  'Pulo',
  'Saba',
  'Sacrifice Valley',
  'San Pedro (Poblacion)',
  'Santo Cristo (Poblacion)',
  'Sumalo',
  'Tipo',
  'Ibang bayan / Other town (isulat sa address / type it in the address)',
];

const FORM_TITLE =
  'Pagpaparehistro: mga apektado ng sunog sa Jinboway / Registration: workers affected by the Jinboway fire';

// ---------------------------------------------------------------- main

function createJinbowayForm() {
  assertConfigured_();
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('FORM_ID')) {
    throw new Error(
      'A form was already created by this script. Run showLinks to see it, or use a new script project.'
    );
  }

  const form = FormApp.create(FORM_TITLE);
  form.setDescription(notice_());
  form.setCollectEmail(false);
  form.setRequireLogin(CONFIG.requireGoogleSignIn);
  form.setLimitOneResponsePerUser(CONFIG.requireGoogleSignIn);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setPublishingSummary(false);
  form.setConfirmationMessage(
    'Salamat. Natanggap na ang iyong impormasyon. Makikipag-ugnayan ang mga tanggapan kung kailangan ng dagdag na detalye. ' +
      'Hindi ito garantiya ng tulong.\n\n' +
      'Thank you. Your information was received. The offices will contact you if more details are needed. ' +
      'This is not a guarantee of assistance.\n\n' +
      'Libre ito. Huwag magbigay ng OTP, PIN o bank details kaninuman.'
  );

  // The order of these items decides the sheet columns (B onward). Keep it in sync with buildReviewSheet_.
  text_(form, 'Apelyido / Surname', true); // B
  text_(form, 'Pangalan / First name', true); // C
  text_(
    form,
    'Gitnang pangalan / Middle name',
    false,
    'Isulat ang N/A kung wala. / Write N/A if none.'
  ); // D
  form
    .addDateItem()
    .setTitle('Petsa ng kapanganakan / Birthdate')
    .setRequired(true); // E
  form
    .addParagraphTextItem()
    .setTitle('Tirahan / Address')
    .setHelpText(
      'Bahay/kalye, barangay, bayan. / House/street, barangay, town.'
    )
    .setRequired(true); // F
  form
    .addListItem()
    .setTitle('Barangay / Bayan / Barangay or town')
    .setChoiceValues(BARANGAYS)
    .setRequired(true); // G
  const phone = text_(
    form,
    'Contact number',
    true,
    'Halimbawa / Example: 09171234567'
  ); // H
  phone.setValidation(
    FormApp.createTextValidation()
      .setHelpText(
        'Ilagay ang 11-digit na numero, hal. 09171234567. / Enter an 11-digit number, e.g. 09171234567.'
      )
      .requireTextMatchesPattern('^(09[0-9]{9}|\\+639[0-9]{9})$')
      .build()
  );
  text_(
    form,
    'Benepisyaryo / Beneficiary',
    true,
    'Sino ang tatanggap ng tulong? Isulat ang SELF kung ikaw mismo ang manggagawa. / Who will receive the aid? Write SELF if you are the worker.'
  ); // I
  text_(form, 'Posisyon / Designation sa Jinboway', true); // J
  text_(
    form,
    'Jinboway company/employee ID number',
    true,
    'Company ID lamang. HUWAG ilagay ang SSS, PhilHealth, TIN o national ID. / Company ID only. Do NOT enter SSS, PhilHealth, TIN or national ID numbers.'
  ); // K
  text_(
    form,
    'Departamento o supervisor (opsyonal) / Department or supervisor (optional)',
    false,
    'Nakakatulong ito sa pag-verify. / This helps with verification.'
  ); // L

  form
    .addCheckboxItem()
    .setTitle('Pahintulot / Consent')
    .setChoiceValues([
      'Pumapayag akong gamitin at ibahagi ang aking impormasyon sa mga tanggapang nakasaad sa itaas para sa pag-coordinate ng tulong. / ' +
        'I agree that my information may be used and shared with the offices named above to coordinate help.',
    ])
    .setRequired(true); // M

  const human = text_(
    form,
    'Patunay na tao ka / Human check',
    true,
    'I-type ang salitang ' +
      CONFIG.humanCheckWord +
      ' sa malalaking titik. / Type the word ' +
      CONFIG.humanCheckWord +
      ' in capital letters.'
  ); // N
  human.setValidation(
    FormApp.createTextValidation()
      .setHelpText(
        'I-type ang ' +
          CONFIG.humanCheckWord +
          ' sa malalaking titik. / Type ' +
          CONFIG.humanCheckWord +
          ' in capital letters.'
      )
      .requireTextMatchesPattern('^' + CONFIG.humanCheckWord + '$')
      .build()
  );

  // Response sheet in the same account.
  const ss = SpreadsheetApp.create('Jinboway registration responses (PRIVATE)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  props.setProperties({
    FORM_ID: form.getId(),
    SHEET_ID: ss.getId(),
  });

  SpreadsheetApp.flush();
  Utilities.sleep(3000); // give Google a moment to create the "Form Responses 1" tab
  buildReviewSheet_(ss);
  installTriggers_();

  showLinks();
}

function showLinks() {
  const props = PropertiesService.getScriptProperties();
  const form = FormApp.openById(props.getProperty('FORM_ID'));
  const sheet = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  Logger.log('PUBLIC form link (share this one): ' + form.getPublishedUrl());
  Logger.log('EDIT link (keep private): ' + form.getEditUrl());
  Logger.log(
    'RESPONSES sheet (keep private, share with named people only): ' +
      sheet.getUrl()
  );
}

// ---------------------------------------------------------------- safeguards

// Runs every 5 minutes: if answers arrive far too fast, stop the form and send an alert with the COUNT only.
function checkRate_() {
  const props = PropertiesService.getScriptProperties();
  const form = FormApp.openById(props.getProperty('FORM_ID'));
  if (!form.isAcceptingResponses()) return;
  const since = new Date(Date.now() - 5 * 60 * 1000);
  const recent = form.getResponses(since).length;
  if (recent > CONFIG.breakerLimit) {
    form.setAcceptingResponses(false);
    form.setCustomClosedFormMessage(
      'Pansamantalang sarado ang form dahil sa dami ng sabay-sabay na sagot. Subukan muli mamaya. / ' +
        'The form is temporarily closed because of unusually many submissions. Please try again later.'
    );
    props.setProperty('BREAKER_TRIPPED', new Date().toISOString());
    MailApp.sendEmail(
      alertEmail_(),
      'Jinboway form paused automatically',
      recent +
        ' answers arrived in 5 minutes (limit ' +
        CONFIG.breakerLimit +
        '). ' +
        'The form stopped accepting answers. Check the Review tab, then run reopenForm if it looks genuine. ' +
        '(This email contains no personal data.)'
    );
  }
}

// Runs once on the closing date.
function closeForm() {
  const form = FormApp.openById(
    PropertiesService.getScriptProperties().getProperty('FORM_ID')
  );
  form.setAcceptingResponses(false);
  form.setCustomClosedFormMessage(
    'Sarado na ang form na ito. / This form is now closed.'
  );
}

// Run this after you have checked the Review tab and want the form open again.
function reopenForm() {
  const form = FormApp.openById(
    PropertiesService.getScriptProperties().getProperty('FORM_ID')
  );
  form.setAcceptingResponses(true);
  PropertiesService.getScriptProperties().deleteProperty('BREAKER_TRIPPED');
}

function removeAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    ScriptApp.deleteTrigger(t);
  });
}

function installTriggers_() {
  removeAllTriggers();
  ScriptApp.newTrigger('checkRate_').timeBased().everyMinutes(5).create();
  const closeAt = new Date(CONFIG.closesOn + 'T23:59:00+08:00');
  if (closeAt.getTime() > Date.now()) {
    ScriptApp.newTrigger('closeForm').timeBased().at(closeAt).create();
  }
}

// A second tab of FORMULAS only (the raw answers are never edited) that flags things to check.
function buildReviewSheet_(ss) {
  const src = "'Form Responses 1'!";
  const sheet = ss.getSheetByName('Review') || ss.insertSheet('Review');
  sheet.clear();
  sheet
    .getRange('A1:H1')
    .setValues([
      [
        'Timestamp',
        'Name',
        'Duplicate phone',
        'Duplicate person',
        'Duplicate company ID',
        'Phone format',
        'Name check',
        'Verified by offices (type YES)',
      ],
    ])
    .setFontWeight('bold');
  const f = function (formula) {
    return '=ARRAYFORMULA(IF(A2:A="","",' + formula + '))';
  };
  sheet
    .getRange('A2')
    .setFormula('=ARRAYFORMULA(IF(' + src + 'A2:A="","",' + src + 'A2:A))');
  sheet
    .getRange('B2')
    .setFormula(f('UPPER(' + src + 'B2:B)&", "&UPPER(' + src + 'C2:C)'));
  sheet
    .getRange('C2')
    .setFormula(
      f('IF(COUNTIF(' + src + 'H2:H,' + src + 'H2:H)>1,"DUPLICATE PHONE","")')
    );
  sheet
    .getRange('D2')
    .setFormula(
      f(
        'IF(COUNTIFS(' +
          src +
          'B2:B,' +
          src +
          'B2:B,' +
          src +
          'C2:C,' +
          src +
          'C2:C,' +
          src +
          'E2:E,' +
          src +
          'E2:E)>1,"DUPLICATE PERSON","")'
      )
    );
  sheet
    .getRange('E2')
    .setFormula(
      f('IF(COUNTIF(' + src + 'K2:K,' + src + 'K2:K)>1,"DUPLICATE ID","")')
    );
  sheet
    .getRange('F2')
    .setFormula(
      f(
        'IF(REGEXMATCH(TO_TEXT(' +
          src +
          'H2:H),"^(09[0-9]{9}|\\+639[0-9]{9})$"),"","CHECK PHONE")'
      )
    );
  sheet
    .getRange('G2')
    .setFormula(
      f(
        'IF(OR(LEN(' +
          src +
          'B2:B)<2,LEN(' +
          src +
          'C2:C)<2,REGEXMATCH(' +
          src +
          'B2:B&' +
          src +
          'C2:C,"[0-9]")),"CHECK NAME","")'
      )
    );
  sheet.setFrozenRows(1);
  // Keep phone numbers and IDs as plain text so a leading zero is not dropped.
  const raw = ss.getSheetByName('Form Responses 1');
  if (raw) {
    raw.getRange('H2:H5000').setNumberFormat('@');
    raw.getRange('K2:K5000').setNumberFormat('@');
  }
}

// ---------------------------------------------------------------- helpers

function text_(form, title, required, help) {
  const item = form.addTextItem().setTitle(title).setRequired(required);
  if (help) item.setHelpText(help);
  return item;
}

function alertEmail_() {
  return CONFIG.alertEmail || Session.getEffectiveUser().getEmail();
}

function assertConfigured_() {
  ['collectorTitle', 'contact', 'closesOn'].forEach(function (k) {
    const v = String(CONFIG[k] || '');
    if (!v || v.indexOf('TODO') === 0) {
      throw new Error('Fill in CONFIG.' + k + ' before running.');
    }
  });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(CONFIG.closesOn)) {
    throw new Error('CONFIG.closesOn must look like 2026-11-30.');
  }
}

function notice_() {
  const who = CONFIG.collectorTitle + ' ' + CONFIG.collectorName;
  return (
    'Ang form na ito ay ginawa ni ' +
    who +
    ' para mangalap ng impormasyon ng mga manggagawang naapektuhan ' +
    'ng sunog sa Jinboway, upang makahingi ng tulong sa ' +
    CONFIG.recipients +
    '. Hindi ito garantiya ng tulong.\n' +
    'This form was created by ' +
    who +
    ' to collect information from workers affected by the Jinboway fire, ' +
    'in order to ask for help from ' +
    CONFIG.recipients +
    '. It is not a guarantee of assistance.\n\n' +
    'LIBRE ITO. Walang bayad. Huwag magbigay ng OTP, PIN o bank details kaninuman. / ' +
    'THIS IS FREE. Never give anyone an OTP, PIN or bank details. ' +
    'Huwag mag-post ng personal na detalye sa mga comment. / Do not post personal details in comments.\n\n' +
    'PRIVACY NOTICE (Data Privacy Act of 2012). Kokolektahin: pangalan, kaarawan, tirahan, contact number, ' +
    'benepisyaryo, posisyon at company ID. Layunin: i-verify ang iyong detalye at i-coordinate ang tulong. ' +
    'Ibabahagi sa: ' +
    CONFIG.recipients +
    ". Itatago lamang hangga't kailangan para sa layuning ito at buburahin pagkatapos. " +
    'Para magtanong, magtama o magpabura ng iyong datos: ' +
    CONFIG.contact +
    '.\n' +
    'We collect: name, birthdate, address, contact number, beneficiary, designation and company ID. Purpose: to verify ' +
    'your details and coordinate help. Shared with: ' +
    CONFIG.recipients +
    '. Kept only as long as needed for this purpose, ' +
    'then deleted. To ask questions, correct or delete your data: ' +
    CONFIG.contact +
    '.\n\n' +
    'Ang form ay bukas hanggang / The form is open until ' +
    CONFIG.closesOn +
    '.'
  );
}
