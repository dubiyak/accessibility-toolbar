(function () {
  'use strict';

  // ── Translations ──────────────────────────────────────────────────────────────
  const I18N = {
    he: {
      toggleBtn:      'נגישות',
      panelTitle:     '♿ הגדרות נגישות',
      close:          'סגור',
      resetAll:       '↺ איפוס הכל',
      sec_profiles:   '⚡ פרופילים מהירים',
      sec_contrast:   '🎨 ניגודיות וצבע',
      sec_font:       '🔤 גופן וטקסט',
      sec_nav:        '🖱 ניווט ותנועה',
      sec_helpers:    '🛠 כלי עזר',
      prof_epilepsy:  'בטוח לאפילפסיה',
      prof_lowVision: 'ראייה לקויה',
      prof_adhd:      'ידידותי ADHD',
      prof_dyslexia:  'ידידותי דיסלקסיה',
      c_dark:         'כהה',
      c_light:        'בהיר',
      c_invert:       'הפוך',
      c_yb:           'צהוב/שחור',
      c_by:           'שחור/צהוב',
      sat_label:      'רוויה',
      sat_low:        'נמוכה',
      sat_normal:     'רגיל',
      sat_high:       'גבוהה',
      grayscale:      'גווני אפור',
      cb_label:       'פיצוי עיוורון צבעים',
      cb_protan:      'פרוטנופיה (אדום)',
      cb_deutan:      'דאוטרנופיה (ירוק)',
      cb_tritan:      'טריטנופיה (כחול)',
      fontSize:       'גודל גופן',
      lineHeight:     'גובה שורה',
      letterSpacing:  'ריווח אותיות',
      wordSpacing:    'ריווח מילים',
      dyslexiaFont:   'גופן ידידותי לדיסלקסיה',
      textAlign:      'יישור טקסט',
      lh_normal:      'רגיל',
      pauseAnim:      'עצירת אנימציות',
      largeCursor:    'סמן גדול',
      focusHL:        'הדגשת פוקוס',
      readingGuide:   'קו קריאה',
      readingMask:    'מסכת קריאה',
      hlLinks:        'הדגשת קישורים',
      hlHeadings:     'הדגשת כותרות',
      hideImages:     'הסתרת תמונות',
      tts:            'קריאת טקסט בקליק',
      lang_label:     'שפה',
      dec_prefix:     'הקטן ',
      inc_prefix:     'הגדל ',
    },
    en: {
      toggleBtn:      'Accessibility',
      panelTitle:     '♿ Accessibility Settings',
      close:          'Close',
      resetAll:       '↺ Reset All',
      sec_profiles:   '⚡ Quick Profiles',
      sec_contrast:   '🎨 Contrast & Color',
      sec_font:       '🔤 Font & Text',
      sec_nav:        '🖱 Navigation & Motion',
      sec_helpers:    '🛠 Helpers',
      prof_epilepsy:  'Epilepsy Safe',
      prof_lowVision: 'Low Vision',
      prof_adhd:      'ADHD Friendly',
      prof_dyslexia:  'Dyslexia Friendly',
      c_dark:         'Dark',
      c_light:        'Light',
      c_invert:       'Invert',
      c_yb:           'Yellow/Black',
      c_by:           'Black/Yellow',
      sat_label:      'Saturation',
      sat_low:        'Low',
      sat_normal:     'Normal',
      sat_high:       'High',
      grayscale:      'Grayscale',
      cb_label:       'Color Blindness',
      cb_protan:      'Protanopia (Red)',
      cb_deutan:      'Deuteranopia (Green)',
      cb_tritan:      'Tritanopia (Blue)',
      fontSize:       'Font Size',
      lineHeight:     'Line Height',
      letterSpacing:  'Letter Spacing',
      wordSpacing:    'Word Spacing',
      dyslexiaFont:   'Dyslexia-Friendly Font',
      textAlign:      'Text Align',
      lh_normal:      'Normal',
      pauseAnim:      'Pause Animations',
      largeCursor:    'Large Cursor',
      focusHL:        'Highlight Focus',
      readingGuide:   'Reading Guide',
      readingMask:    'Reading Mask',
      hlLinks:        'Highlight Links',
      hlHeadings:     'Highlight Headings',
      hideImages:     'Hide Images',
      tts:            'Click-to-Read Text',
      lang_label:     'Language',
      dec_prefix:     'Decrease ',
      inc_prefix:     'Increase ',
    },
  };

  // ── Read per-site config from <script> tag attributes ────────────────────────
  // Usage: <script src="toolbar.js"
  //          data-lang="en"
  //          data-position="bottom-left"
  //          data-color="#7c3aed"
  //          data-hide="tts,readingMask"
  //          data-storage-key="my-site-a11y">
  // </script>
  const _script = document.currentScript;
  function attr(name, fallback) {
    return (_script && _script.getAttribute('data-' + name)) || fallback;
  }

  const SITE = {
    lang:       attr('lang',        'he'),           // שפת ברירת מחדל
    position:   attr('position',    'bottom-left'),  // bottom-right | bottom-left
    color:      attr('color',       '#1d4ed8'),      // צבע כפתור ראשי (hex)
    storageKey: attr('storage-key', 'a11y-tb-v3'),  // מפתח localStorage ייחודי לאתר
    hide:  new Set((attr('hide', '') || '').split(',').map(s => s.trim()).filter(Boolean)),
  };

  // ── Configuration ─────────────────────────────────────────────────────────────
  const CFG = {
    storageKey: SITE.storageKey,
    fontStep: 2, fontMin: -4, fontMax: 16,
    lineStep: 0.2, lineMax: 2.0,
    lsStep: 1, lsMax: 6,
    wsStep: 2, wsMax: 10,
  };

  // ── Default state ─────────────────────────────────────────────────────────────
  const DEFAULTS = {
    lang: SITE.lang,
    profile: null,
    contrast: null,
    grayscale: false,
    saturation: 0,
    colorBlind: null,
    fontSize: 0,
    dyslexiaFont: false,
    lineHeight: 0,
    letterSpacing: 0,
    wordSpacing: 0,
    textAlign: null,
    pauseAnimations: false,
    largeCursor: false,
    focusHighlight: false,
    readingGuide: false,
    readingMask: false,
    highlightLinks: false,
    highlightHeadings: false,
    hideImages: false,
    tts: false,
  };

  let state = { ...DEFAULTS };
  let panelEl = null;
  let guideEl = null;
  let maskEl = null;

  function t(key) { return (I18N[state.lang] || I18N.he)[key] || key; }

  // ── Persistence ───────────────────────────────────────────────────────────────
  function load() {
    try { state = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(CFG.storageKey) || '{}') }; } catch (_) {}
  }
  function save() {
    try { localStorage.setItem(CFG.storageKey, JSON.stringify(state)); } catch (_) {}
  }

  // ── Profile presets ───────────────────────────────────────────────────────────
  const PROFILES = {
    epilepsy:  { pauseAnimations: true, saturation: -1 },
    lowVision: { fontSize: 6, contrast: 'dark', largeCursor: true, focusHighlight: true },
    adhd:      { readingGuide: true, readingMask: true, pauseAnimations: true, highlightLinks: true },
    dyslexia:  { dyslexiaFont: true, letterSpacing: 2, lineHeight: 0.6, wordSpacing: 4, textAlign: state.lang === 'he' ? 'right' : 'left' },
  };

  function activateProfile(key) {
    Object.values(PROFILES).forEach(p => Object.keys(p).forEach(k => { state[k] = DEFAULTS[k]; }));
    if (key) Object.assign(state, PROFILES[key]);
    state.profile = key;
  }

  // ── Apply state → DOM ─────────────────────────────────────────────────────────
  function apply() {
    const html = document.documentElement;
    const body = document.body;

    html.style.fontSize    = state.fontSize    ? `calc(1em + ${state.fontSize}px)` : '';
    body.style.lineHeight  = state.lineHeight  ? (1.5 + state.lineHeight).toFixed(1) : '';
    body.style.letterSpacing = state.letterSpacing ? state.letterSpacing + 'px' : '';
    body.style.wordSpacing   = state.wordSpacing   ? state.wordSpacing + 'px'   : '';
    body.style.textAlign     = state.textAlign || '';

    if (state.dyslexiaFont) {
      body.style.fontFamily = '"Arial", "Trebuchet MS", sans-serif';
      body.style.fontWeight = '500';
    } else {
      body.style.fontFamily = '';
      body.style.fontWeight = '';
    }

    const contrastClasses = ['a11y-c-dark','a11y-c-light','a11y-c-invert','a11y-c-yb','a11y-c-by'];
    contrastClasses.forEach(c => html.classList.remove(c));
    if (state.contrast) html.classList.add('a11y-c-' + state.contrast);

    const colorClasses = ['a11y-grayscale','a11y-sat-low','a11y-sat-high',
                          'a11y-cb-protanopia','a11y-cb-deuteranopia','a11y-cb-tritanopia'];
    colorClasses.forEach(c => html.classList.remove(c));
    if      (state.grayscale)           html.classList.add('a11y-grayscale');
    else if (state.saturation < 0)      html.classList.add('a11y-sat-low');
    else if (state.saturation > 0)      html.classList.add('a11y-sat-high');
    else if (state.colorBlind)          html.classList.add('a11y-cb-' + state.colorBlind);

    const boolMap = {
      pauseAnimations:  'a11y-pause',
      largeCursor:      'a11y-cursor-lg',
      focusHighlight:   'a11y-focus-hl',
      highlightLinks:   'a11y-hl-links',
      highlightHeadings:'a11y-hl-heads',
      hideImages:       'a11y-hide-img',
    };
    Object.entries(boolMap).forEach(([k, cls]) => html.classList.toggle(cls, !!state[k]));

    if (state.readingGuide) {
      if (!guideEl) { guideEl = el('div', { id:'a11y-guide', 'aria-hidden':'true' }); document.body.appendChild(guideEl); }
      guideEl.style.display = 'block';
    } else if (guideEl) guideEl.style.display = 'none';

    if (state.readingMask) {
      if (!maskEl) {
        maskEl = el('div', { id:'a11y-mask', 'aria-hidden':'true' });
        maskEl.innerHTML = '<div class="a11y-mask-top"></div><div class="a11y-mask-bot"></div>';
        document.body.appendChild(maskEl);
      }
      maskEl.style.display = 'block';
    } else if (maskEl) maskEl.style.display = 'none';

    if (!state.tts && window.speechSynthesis) window.speechSynthesis.cancel();

    syncUI();
    save();
  }

  document.addEventListener('mousemove', (e) => {
    const y = e.clientY;
    if (guideEl && guideEl.style.display !== 'none') guideEl.style.top = y + 'px';
    if (maskEl  && maskEl.style.display  !== 'none') {
      const band = 50;
      maskEl.querySelector('.a11y-mask-top').style.height = Math.max(0, y - band) + 'px';
      maskEl.querySelector('.a11y-mask-bot').style.top    = (y + band) + 'px';
    }
  });

  document.addEventListener('click', (e) => {
    if (!state.tts) return;
    if (e.target.closest('#a11y-toolbar')) return;
    const text = e.target.textContent?.trim();
    if (text && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = state.lang === 'he' ? 'he-IL' : 'en-US';
      window.speechSynthesis.speak(u);
    }
  });

  // ── DOM helper ────────────────────────────────────────────────────────────────
  function el(tag, attrs = {}, text = '') {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    if (text) e.textContent = text;
    return e;
  }

  // ── Build toolbar ─────────────────────────────────────────────────────────────
  function build() {
    const root = el('div', { id:'a11y-toolbar', role:'region', 'aria-label':'Accessibility toolbar' });

    const toggle = el('button', { id:'a11y-toggle', 'aria-expanded':'false', 'aria-controls':'a11y-panel' });
    toggle.innerHTML = '<span aria-hidden="true">♿</span><span id="a11y-toggle-label"></span>';
    toggle.addEventListener('click', () => {
      const open = panelEl.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      if (open) panelEl.querySelector('button')?.focus();
    });

    panelEl = el('div', { id:'a11y-panel', role:'dialog', 'aria-label':'Accessibility settings' });

    root.appendChild(panelEl);
    root.appendChild(toggle);
    document.body.appendChild(root);

    document.addEventListener('click', (e) => {
      if (!root.contains(e.target) && panelEl.classList.contains('open')) {
        panelEl.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    rebuildPanel();
  }

  // ── Rebuild panel content (called on lang change) ─────────────────────────────
  function rebuildPanel() {
    panelEl.innerHTML = '';
    const toggle = document.getElementById('a11y-toggle');
    const isRtl  = state.lang === 'he';

    // Panel direction
    panelEl.style.direction = isRtl ? 'rtl' : 'ltr';

    // Update toggle label
    const lbl = document.getElementById('a11y-toggle-label');
    if (lbl) lbl.textContent = t('toggleBtn');

    // Header
    panelEl.appendChild(buildHeader(toggle, isRtl));

    // Language switcher (in its own mini-section)
    panelEl.appendChild(buildLangSwitcher());

    // Sections
    panelEl.appendChild(section(t('sec_profiles'), profiles()));
    panelEl.appendChild(section(t('sec_contrast'), contrastColor()));
    panelEl.appendChild(section(t('sec_font'),     fontText()));
    panelEl.appendChild(section(t('sec_nav'),      navMotion()));
    panelEl.appendChild(section(t('sec_helpers'),  helpers()));

    // Reset
    const rst = el('button', { class:'a11y-reset' }, t('resetAll'));
    rst.addEventListener('click', () => {
      const savedLang = state.lang;
      state = { ...DEFAULTS, lang: savedLang };
      apply();
      rebuildPanel();
    });
    panelEl.appendChild(rst);

    syncUI();
  }

  function buildHeader(toggle, isRtl) {
    const h = el('div', { class:'a11y-hdr' });
    const title = el('span', { class:'a11y-title' }, t('panelTitle'));
    const x = el('button', { class:'a11y-x', 'aria-label': t('close') }, '✕');
    x.addEventListener('click', () => {
      panelEl.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
    if (isRtl) { h.appendChild(title); h.appendChild(x); }
    else        { h.appendChild(x);     h.appendChild(title); }
    return h;
  }

  function buildLangSwitcher() {
    const wrap = el('div', { class:'a11y-lang-bar' });

    ['he','en'].forEach(lang => {
      const b = el('button', { class:'a11y-lang-btn', 'data-lang':lang });
      b.innerHTML = lang === 'he'
        ? '<span aria-hidden="true">🇮🇱</span> עברית'
        : '<span aria-hidden="true">🇺🇸</span> English';
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        state.lang = lang;
        save();
        rebuildPanel();
        apply();
      });
      wrap.appendChild(b);
    });

    return wrap;
  }

  function section(title, content) {
    const s = el('div', { class:'a11y-sec' });
    s.appendChild(el('div', { class:'a11y-sec-lbl' }, title));
    s.appendChild(content);
    return s;
  }

  // ── Section builders ──────────────────────────────────────────────────────────
  function profiles() {
    const w = el('div', { class:'g2' });
    [
      { key:'epilepsy',  icon:'⚡', lbl: t('prof_epilepsy') },
      { key:'lowVision', icon:'👁',  lbl: t('prof_lowVision') },
      { key:'adhd',      icon:'🧠', lbl: t('prof_adhd') },
      { key:'dyslexia',  icon:'📖', lbl: t('prof_dyslexia') },
    ].forEach(({ key, icon, lbl }) => {
      const b = el('button', { class:'a11y-prof', 'data-prof':key });
      b.innerHTML = `<span class="ico">${icon}</span><span>${lbl}</span>`;
      b.addEventListener('click', () => { activateProfile(state.profile === key ? null : key); apply(); });
      w.appendChild(b);
    });
    return w;
  }

  function contrastColor() {
    const w = el('div', { class:'col' });

    const cg = el('div', { class:'g3' });
    [
      { val:'dark',  icon:'🌑', lbl:t('c_dark') },
      { val:'light', icon:'🌕', lbl:t('c_light') },
      { val:'invert',icon:'🔄', lbl:t('c_invert') },
      { val:'yb',    icon:'⚫', lbl:t('c_yb') },
      { val:'by',    icon:'🟡', lbl:t('c_by') },
    ].forEach(({ val, icon, lbl }) => {
      const b = el('button', { class:'a11y-chip', 'data-contrast':val });
      b.innerHTML = `${icon}<br><small>${lbl}</small>`;
      b.addEventListener('click', () => { state.contrast = state.contrast === val ? null : val; apply(); });
      cg.appendChild(b);
    });
    w.appendChild(cg);

    w.appendChild(segRow(t('sat_label'), 'saturation', [
      { val:-1, lbl:t('sat_low') }, { val:0, lbl:t('sat_normal') }, { val:1, lbl:t('sat_high') },
    ]));

    append(w, toggleRow('grayscale', '⬜', t('grayscale')));

    w.appendChild(el('div', { class:'a11y-sub' }, t('cb_label')));

    const cbg = el('div', { class:'g3' });
    [
      { val:'protanopia',   lbl:t('cb_protan') },
      { val:'deuteranopia', lbl:t('cb_deutan') },
      { val:'tritanopia',   lbl:t('cb_tritan') },
    ].forEach(({ val, lbl }) => {
      const b = el('button', { class:'a11y-chip', 'data-cb':val, style:'font-size:10px' }, lbl);
      b.addEventListener('click', () => {
        state.grayscale = false; state.saturation = 0;
        state.colorBlind = state.colorBlind === val ? null : val;
        apply();
      });
      cbg.appendChild(b);
    });
    w.appendChild(cbg);

    return w;
  }

  function fontText() {
    const w = el('div', { class:'col' });
    w.appendChild(stepper('fontSize',     '🔤', t('fontSize'),      CFG.fontMin, CFG.fontMax, CFG.fontStep, v => (v>0?'+':'')+v+'px'));
    w.appendChild(stepper('lineHeight',   '↕',  t('lineHeight'),    0, CFG.lineMax, CFG.lineStep, v => v ? '+'+v.toFixed(1) : t('lh_normal')));
    w.appendChild(stepper('letterSpacing','↔',  t('letterSpacing'), 0, CFG.lsMax,  CFG.lsStep,   v => v+'px'));
    w.appendChild(stepper('wordSpacing',  '⎵',  t('wordSpacing'),   0, CFG.wsMax,  CFG.wsStep,   v => v+'px'));
    append(w, toggleRow('dyslexiaFont','📖', t('dyslexiaFont')));
    w.appendChild(segRow(t('textAlign'), 'textAlign', [
      { val:null,     lbl:'✕' },
      { val:'right',  lbl:'⇥' },
      { val:'center', lbl:'≡' },
      { val:'left',   lbl:'⇤' },
    ]));
    return w;
  }

  function navMotion() {
    const w = el('div', { class:'col' });
    append(w, toggleRow('pauseAnimations','⏸', t('pauseAnim')));
    append(w, toggleRow('largeCursor',    '🖱', t('largeCursor')));
    append(w, toggleRow('focusHighlight', '🔍', t('focusHL')));
    return w;
  }

  function helpers() {
    const w = el('div', { class:'col' });
    append(w, toggleRow('readingGuide',    '📏', t('readingGuide')));
    append(w, toggleRow('readingMask',     '🎭', t('readingMask')));
    append(w, toggleRow('highlightLinks',  '🔗', t('hlLinks')));
    append(w, toggleRow('highlightHeadings','📌',t('hlHeadings')));
    append(w, toggleRow('hideImages',      '🖼', t('hideImages')));
    append(w, toggleRow('tts',             '🔊', t('tts')));
    return w;
  }

  // ── UI component builders ─────────────────────────────────────────────────────
  // Safe append — skips null (from hidden features)
  function append(parent, child) { if (child) parent.appendChild(child); }

  function toggleRow(key, icon, label) {
    if (SITE.hide.has(key)) return null;
    const b = el('button', { class:'a11y-tr', 'data-tk':key, 'aria-pressed':String(!!state[key]) });
    b.innerHTML = `<span class="ico" aria-hidden="true">${icon}</span><span class="lbl">${label}</span><span class="sw" aria-hidden="true"><span class="sw-thumb"></span></span>`;
    b.addEventListener('click', () => { state[key] = !state[key]; apply(); });
    return b;
  }

  function stepper(key, icon, label, min, max, step, fmt) {
    const row = el('div', { class:'a11y-sr' });
    row._key = key; row._fmt = fmt;

    const lbl = el('span', { class:'sr-lbl' });
    lbl.innerHTML = `<span class="ico" aria-hidden="true">${icon}</span>${label}`;

    const dec = el('button', { class:'sr-btn', 'aria-label': t('dec_prefix') + label }, '−');
    dec.addEventListener('click', () => { if (state[key] > min) { state[key] = round(state[key] - step); apply(); } });

    const val = el('span', { class:'sr-val', 'data-sk':key }, fmt(state[key]));

    const inc = el('button', { class:'sr-btn', 'aria-label': t('inc_prefix') + label }, '+');
    inc.addEventListener('click', () => { if (state[key] < max) { state[key] = round(state[key] + step); apply(); } });

    row.append(lbl, dec, val, inc);
    return row;
  }

  function segRow(label, key, opts) {
    const row = el('div', { class:'seg-row' });
    row.appendChild(el('span', { class:'lbl' }, label));
    const grp = el('div', { class:'seg-grp' });
    opts.forEach(({ val, lbl }) => {
      const b = el('button', { class:'seg-btn', 'data-seg-key':key, 'data-seg-val':JSON.stringify(val) }, lbl);
      b.addEventListener('click', () => { state[key] = val; apply(); });
      grp.appendChild(b);
    });
    row.appendChild(grp);
    return row;
  }

  function round(v) { return Math.round(v * 100) / 100; }

  // ── Sync UI ───────────────────────────────────────────────────────────────────
  function syncUI() {
    if (!panelEl) return;

    panelEl.querySelectorAll('[data-prof]').forEach(b =>
      b.classList.toggle('active', state.profile === b.dataset.prof));
    panelEl.querySelectorAll('[data-contrast]').forEach(b =>
      b.classList.toggle('active', state.contrast === b.dataset.contrast));
    panelEl.querySelectorAll('[data-cb]').forEach(b =>
      b.classList.toggle('active', state.colorBlind === b.dataset.cb));
    panelEl.querySelectorAll('[data-tk]').forEach(b => {
      const on = !!state[b.dataset.tk];
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    panelEl.querySelectorAll('[data-sk]').forEach(span => {
      const row = span.closest('.a11y-sr');
      if (row) span.textContent = row._fmt(state[row._key]);
    });
    panelEl.querySelectorAll('[data-seg-key]').forEach(b => {
      b.classList.toggle('active', state[b.dataset.segKey] === JSON.parse(b.dataset.segVal));
    });
    panelEl.querySelectorAll('[data-lang]').forEach(b =>
      b.classList.toggle('active', state.lang === b.dataset.lang));
  }

  // ── SVG color-blind filters ───────────────────────────────────────────────────
  function injectSVG() {
    if (document.getElementById('a11y-svg')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'a11y-svg';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.innerHTML = `<defs>
      <filter id="a11y-filter-protanopia"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"/></filter>
      <filter id="a11y-filter-deuteranopia"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/></filter>
      <filter id="a11y-filter-tritanopia"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"/></filter>
    </defs>`;
    document.body.appendChild(svg);
  }

  // ── CSS ───────────────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('a11y-css')) return;
    const s = document.createElement('style');
    s.id = 'a11y-css';
    const isLeft   = SITE.position === 'bottom-left';
    const side     = isLeft ? 'left' : 'right';
    const col      = SITE.color;
    s.textContent = `
#a11y-toolbar{position:fixed;${side}:16px;bottom:16px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif}
#a11y-toggle{display:flex;align-items:center;gap:8px;padding:11px 18px;background:${col};color:#fff;border:none;border-radius:50px;cursor:pointer;font-size:14px;font-weight:700;box-shadow:0 4px 20px rgba(0,0,0,.3);letter-spacing:normal;word-spacing:normal;transition:background .15s,transform .1s}
#a11y-toggle:hover{filter:brightness(.88);transform:scale(1.04)}
#a11y-toggle:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}
#a11y-panel{display:none;position:absolute;${side}:0;bottom:calc(100% + 10px);width:310px;max-height:82vh;overflow-y:auto;overflow-x:hidden;background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,.2);flex-direction:column;gap:0;letter-spacing:normal;word-spacing:normal;scrollbar-width:thin}
#a11y-panel.open{display:flex}
.a11y-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 12px;border-bottom:1px solid #f1f5f9;position:sticky;top:0;background:#fff;z-index:1;border-radius:16px 16px 0 0}
.a11y-title{font-size:14px;font-weight:800;color:#0f172a}
.a11y-x{border:none;background:#f1f5f9;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:13px;color:#64748b;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.a11y-x:hover{background:#e2e8f0}

/* Language bar */
.a11y-lang-bar{display:flex;gap:6px;padding:10px 14px;border-bottom:1px solid #f1f5f9;background:#fafbfc}
.a11y-lang-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;font-size:13px;color:#475569;font-weight:500;transition:all .15s}
.a11y-lang-btn:hover{background:#eff6ff;border-color:#bfdbfe}
.a11y-lang-btn.active{background:#dbeafe;border-color:#3b82f6;color:#1e40af;font-weight:700}

.a11y-sec{padding:12px 14px;border-bottom:1px solid #f1f5f9}
.a11y-sec:last-of-type{border-bottom:none}
.a11y-sec-lbl{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px}
.a11y-sub{font-size:10px;color:#94a3b8;margin:8px 0 4px}
.col{display:flex;flex-direction:column;gap:6px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px}
.a11y-prof{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;border:1.5px solid #e2e8f0;border-radius:10px;background:#f8fafc;cursor:pointer;font-size:11px;color:#334155;transition:all .15s}
.a11y-prof .ico{font-size:22px}
.a11y-prof:hover{background:#eff6ff;border-color:#bfdbfe}
.a11y-prof.active{background:#dbeafe;border-color:#3b82f6;color:#1e40af;font-weight:700}
.a11y-chip{padding:8px 4px;border:1.5px solid #e2e8f0;border-radius:8px;background:#f8fafc;cursor:pointer;font-size:12px;color:#334155;text-align:center;transition:all .12s;line-height:1.4}
.a11y-chip:hover{background:#eff6ff;border-color:#bfdbfe}
.a11y-chip.active{background:#dbeafe;border-color:#3b82f6;color:#1e40af;font-weight:700}
.seg-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.seg-row .lbl{font-size:13px;color:#334155;white-space:nowrap}
.seg-grp{display:flex;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
.seg-btn{flex:1;padding:5px 9px;border:none;border-left:1px solid #e2e8f0;background:#f8fafc;cursor:pointer;font-size:12px;color:#475569;transition:background .1s}
.seg-btn:first-child{border-left:none}
.seg-btn:hover{background:#eff6ff}
.seg-btn.active{background:#3b82f6;color:#fff;font-weight:700}
.a11y-tr{display:flex;align-items:center;gap:10px;padding:9px 11px;border:1.5px solid #e2e8f0;border-radius:10px;background:#f8fafc;cursor:pointer;width:100%;transition:all .12s}
.a11y-tr:hover{background:#eff6ff;border-color:#bfdbfe}
.a11y-tr.active{background:#dbeafe;border-color:#3b82f6}
.a11y-tr .ico{font-size:17px;min-width:22px;text-align:center}
.a11y-tr .lbl{flex:1;font-size:13px;color:#334155}
.a11y-tr.active .lbl{color:#1e40af;font-weight:600}
.sw{width:36px;height:20px;background:#cbd5e1;border-radius:10px;position:relative;flex-shrink:0;transition:background .2s}
.sw-thumb{position:absolute;top:3px;right:3px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.a11y-tr.active .sw{background:#3b82f6}
.a11y-tr.active .sw-thumb{transform:translateX(-16px)}
.a11y-sr{display:flex;align-items:center;gap:6px;padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:10px;background:#f8fafc}
.sr-lbl{flex:1;font-size:13px;color:#334155;display:flex;align-items:center;gap:6px}
.sr-lbl .ico{font-size:15px}
.sr-btn{width:28px;height:28px;border:1px solid #d1d5db;border-radius:7px;background:#fff;cursor:pointer;font-size:17px;color:#374151;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .1s}
.sr-btn:hover{background:#dbeafe}
.sr-val{font-size:12px;color:#64748b;min-width:40px;text-align:center}
.a11y-reset{margin:8px 14px 14px;padding:10px;border:none;border-radius:10px;background:#fef2f2;color:#dc2626;cursor:pointer;font-size:13px;font-weight:700;letter-spacing:normal;transition:background .12s;width:calc(100% - 28px)}
.a11y-reset:hover{background:#fee2e2}
#a11y-guide{position:fixed;left:0;right:0;height:3px;background:rgba(239,68,68,.75);pointer-events:none;z-index:2147483646;display:none;box-shadow:0 0 8px rgba(239,68,68,.4)}
#a11y-mask{position:fixed;inset:0;pointer-events:none;z-index:2147483645;display:none}
.a11y-mask-top{position:fixed;left:0;right:0;top:0;height:0;background:rgba(0,0,0,.6)}
.a11y-mask-bot{position:fixed;left:0;right:0;bottom:0;top:100%;background:rgba(0,0,0,.6)}
html.a11y-c-dark,html.a11y-c-dark body{background:#000!important;color:#fff!important}
html.a11y-c-dark a{color:#7dd3fc!important}
html.a11y-c-dark button,html.a11y-c-dark input,html.a11y-c-dark select,html.a11y-c-dark textarea{background:#111!important;color:#fff!important;border-color:#555!important}
html.a11y-c-light,html.a11y-c-light body{background:#fff!important;color:#000!important}
html.a11y-c-invert{filter:invert(1) hue-rotate(180deg)}
html.a11y-c-invert img,html.a11y-c-invert video{filter:invert(1) hue-rotate(180deg)}
html.a11y-c-yb,html.a11y-c-yb body{background:#000!important;color:#ff0!important}
html.a11y-c-yb a{color:#f90!important}
html.a11y-c-by,html.a11y-c-by body{background:#ff0!important;color:#000!important}
html.a11y-grayscale{filter:grayscale(1)}
html.a11y-sat-low{filter:saturate(.25)}
html.a11y-sat-high{filter:saturate(2.8)}
html.a11y-cb-protanopia{filter:url(#a11y-filter-protanopia)}
html.a11y-cb-deuteranopia{filter:url(#a11y-filter-deuteranopia)}
html.a11y-cb-tritanopia{filter:url(#a11y-filter-tritanopia)}
html.a11y-pause *,html.a11y-pause *::before,html.a11y-pause *::after{animation-play-state:paused!important;transition:none!important}
html.a11y-cursor-lg,html.a11y-cursor-lg *{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M6 6L6 36L15 27L21 43L26 41L20 25L31 25Z' fill='%23000' stroke='%23fff' stroke-width='2.5'/%3E%3C/svg%3E") 6 6,auto!important}
html.a11y-focus-hl *:focus{outline:4px solid #f59e0b!important;outline-offset:3px!important;border-radius:2px}
html.a11y-hl-links a{text-decoration:underline!important;outline:2px solid #f59e0b!important;outline-offset:2px!important;border-radius:2px}
html.a11y-hl-heads h1,html.a11y-hl-heads h2,html.a11y-hl-heads h3,html.a11y-hl-heads h4,html.a11y-hl-heads h5,html.a11y-hl-heads h6{border-right:4px solid #3b82f6!important;padding-right:10px!important;background:rgba(59,130,246,.08)!important;border-radius:0 6px 6px 0}
html.a11y-hide-img img,html.a11y-hide-img picture,html.a11y-hide-img figure,html.a11y-hide-img svg:not(#a11y-svg){visibility:hidden!important}
    `;
    document.head.appendChild(s);
  }

  // ── Boot ──────────────────────────────────────────────────────────────────────
  function init() {
    load();
    injectCSS();
    injectSVG();
    build();
    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
