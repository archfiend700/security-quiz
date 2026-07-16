/* ==========================================================================
   GUARDORA SECURITY RISK ASSESSMENT
   Vanilla JS, no dependencies. Structured so a future version can swap
   local scoring for a real scanning API / backend without touching the
   render layer (see DATA + STATE + ENGINE + UI sections below).
   ========================================================================== */

(function(){
  'use strict';

  /* ------------------------------------------------------------------
     DATA — questions, packages, FAQ
     Each question: id, category, weight (informational, for future
     weighted-scoring versions), explanation, recommendedAction, answers[]
     ------------------------------------------------------------------ */

  const QUESTIONS = [
    {
      id: 'web_scan',
      category: 'Website Security',
      text: 'Do you regularly scan your website for vulnerabilities?',
      explanation: 'Unpatched website vulnerabilities are one of the most common entry points for attackers.',
      recommendedAction: 'Schedule automated vulnerability scans at least monthly.',
      answers: [
        { label: 'Yes', points: 0 },
        { label: 'Sometimes', points: 5 },
        { label: 'Never', points: 15 }
      ]
    },
    {
      id: 'web_https',
      category: 'Website Security',
      text: 'Does your website have HTTPS enabled?',
      explanation: 'Without HTTPS, sensitive information may be exposed during communication.',
      recommendedAction: 'Enable a valid TLS certificate and force HTTPS site-wide.',
      answers: [
        { label: 'Yes', points: 0 },
        { label: 'No', points: 15 }
      ]
    },
    {
      id: 'web_plugins',
      category: 'Website Security',
      text: 'Do you know if your website uses outdated plugins or CMS components?',
      explanation: 'Outdated plugins and CMS components are a leading cause of website compromise.',
      recommendedAction: 'Inventory installed components and set up update monitoring.',
      answers: [
        { label: 'Yes, monitored', points: 0 },
        { label: 'Not sure', points: 10 },
        { label: 'No', points: 15 }
      ]
    },
    {
      id: 'domain_dns',
      category: 'Domain & DNS',
      text: 'Is your domain protected with registrar security features, such as registry lock or WHOIS privacy?',
      explanation: 'Unprotected domains can be hijacked or transferred without your knowledge, taking your website and email offline.',
      recommendedAction: 'Enable registry lock and two-factor authentication at your registrar.',
      answers: [
        { label: 'Yes', points: 0 },
        { label: 'Not sure', points: 8 },
        { label: 'No', points: 15 }
      ]
    },
    {
      id: 'email_mfa',
      category: 'Email Security',
      text: 'Is multi-factor authentication (MFA) enabled for company email accounts?',
      explanation: 'Compromised email accounts are frequently used for fraud, phishing, and data theft.',
      recommendedAction: 'Enforce MFA for every account, starting with finance and admin roles.',
      answers: [
        { label: 'All users', points: 0 },
        { label: 'Some users', points: 10 },
        { label: 'Nobody', points: 20 }
      ]
    },
    {
      id: 'email_auth',
      category: 'Email Security',
      text: 'Do you use SPF, DKIM, and DMARC to authenticate your email domain?',
      explanation: 'Without proper email authentication, attackers can impersonate your domain in phishing campaigns.',
      recommendedAction: 'Configure SPF, DKIM, and DMARC records and monitor DMARC reports.',
      answers: [
        { label: 'All configured', points: 0 },
        { label: 'Some', points: 10 },
        { label: 'None', points: 15 }
      ]
    },
    {
      id: 'employee_training',
      category: 'Employee Security',
      text: 'Do employees receive regular security awareness training?',
      explanation: 'Most breaches start with a human decision — a clicked link or a shared credential.',
      recommendedAction: 'Run short, recurring phishing and awareness training for all staff.',
      answers: [
        { label: 'Yes, regularly', points: 0 },
        { label: 'Occasionally', points: 8 },
        { label: 'Never', points: 15 }
      ]
    },
    {
      id: 'password_reuse',
      category: 'Password Management',
      text: 'Do employees reuse passwords across multiple accounts?',
      explanation: 'Reused passwords mean one leaked credential can unlock several systems at once.',
      recommendedAction: 'Roll out a password manager and enforce unique credentials per system.',
      answers: [
        { label: 'Never', points: 0 },
        { label: 'Sometimes', points: 10 },
        { label: 'Often', points: 20 }
      ]
    },
    {
      id: 'software_updates',
      category: 'Software Updates',
      text: 'Are your systems and software kept up to date with security patches?',
      explanation: 'Unpatched software is one of the most exploited weaknesses in small business networks.',
      recommendedAction: 'Enable automatic updates and review patch status monthly.',
      answers: [
        { label: 'Always', points: 0 },
        { label: 'Sometimes', points: 10 },
        { label: 'Rarely', points: 18 }
      ]
    },
    {
      id: 'backups',
      category: 'Backup & Recovery',
      text: 'Do you have tested backups of your critical business data?',
      explanation: 'Ransomware attacks often target backups to prevent recovery.',
      recommendedAction: 'Maintain offline or immutable backups and test restores quarterly.',
      answers: [
        { label: 'Yes, tested', points: 0 },
        { label: 'Backups exist, untested', points: 10 },
        { label: 'No backups', points: 20 }
      ]
    },
    {
      id: 'access_control',
      category: 'Access Control',
      text: 'Do former employees still have access to company systems?',
      explanation: 'Lingering access from former employees is an easy, often-overlooked way in.',
      recommendedAction: 'Set up an offboarding checklist that revokes access immediately on exit.',
      answers: [
        { label: 'No', points: 0 },
        { label: 'Not sure', points: 15 },
        { label: 'Yes', points: 20 }
      ]
    },
    {
      id: 'data_protection',
      category: 'Data Protection',
      text: 'Is sensitive customer or business data encrypted and access-restricted?',
      explanation: 'Unprotected data increases the impact of any breach and may create compliance exposure.',
      recommendedAction: 'Classify sensitive data and restrict access on a need-to-know basis.',
      answers: [
        { label: 'Yes', points: 0 },
        { label: 'Partially', points: 10 },
        { label: 'No', points: 18 }
      ]
    },
    {
      id: 'monitoring',
      category: 'Monitoring',
      text: 'Would you know if someone accessed your website or systems suspiciously?',
      explanation: 'Unknown vulnerabilities and intrusions may remain unnoticed without monitoring in place.',
      recommendedAction: 'Set up continuous monitoring and alerting for unusual access patterns.',
      answers: [
        { label: 'Yes', points: 0 },
        { label: 'Not sure', points: 10 },
        { label: 'No', points: 20 }
      ]
    }
  ];

  const RISK_LEVELS = [
    { key: 'low',      min: 0,   max: 25,      label: 'LOW RISK',      color: 'var(--risk-low)',      desc: 'Your security foundation looks reasonable, but continuous monitoring is recommended.' },
    { key: 'medium',    min: 26,  max: 60,      label: 'MEDIUM RISK',   color: 'var(--risk-medium)',   desc: 'Several weaknesses could increase the chance of compromise.' },
    { key: 'high',      min: 61,  max: 100,     label: 'HIGH RISK',     color: 'var(--risk-high)',     desc: 'Your business has multiple security gaps that attackers commonly target.' },
    { key: 'critical',  min: 101, max: Infinity, label: 'CRITICAL RISK', color: 'var(--risk-critical)', desc: 'Immediate security improvements are recommended.' }
  ];

  const PACKAGES = {
    low: {
      name: 'Basic Security Check',
      tag: 'Recommended for low risk businesses',
      items: ['Website vulnerability scan', 'Basic security report', 'SSL / HTTPS checks', 'Prioritized recommendations']
    },
    medium: {
      name: 'Business Security Assessment',
      tag: 'Recommended for medium risk businesses',
      items: ['Website scan', 'DNS analysis', 'Email security review', 'Vulnerability assessment', 'Detailed report']
    },
    high: {
      name: 'Advanced Protection',
      tag: 'Recommended for high / critical risk businesses',
      items: ['Full vulnerability assessment', 'Continuous monitoring', 'Security hardening plan', 'Regular reporting']
    }
  };
  PACKAGES.critical = PACKAGES.high;

  const FAQS = [
    {
      q: 'What can attackers do with these weaknesses?',
      a: 'Depending on what\u2019s exposed, attackers may read or steal customer data, impersonate your company in phishing emails, deface your website, or lock your files with ransomware until you pay to get them back.'
    },
    {
      q: 'Why are small businesses targeted?',
      a: 'Small businesses often have valuable data but fewer defenses than large enterprises, making them an efficient target. Many attacks are automated and simply look for the easiest door left open, not a specific company.'
    },
    {
      q: 'How does Guardora help?',
      a: 'Guardora continuously monitors your attack surface \u2014 website, domain, and email \u2014 and translates technical findings into plain-language digests, so you know what to fix first and why it matters.'
    }
  ];

  /* ------------------------------------------------------------------
     STATE
     ------------------------------------------------------------------ */

  const STORAGE_KEY = 'guardora_assessment_progress';
  const LEADS_KEY = 'guardora_leads';

  
  const LEAD_EMAIL_ENDPOINT = 'https://formspree.io/f/mvzegjdy';

  let state = {
    currentIndex: 0,
    answers: {} // { questionId: answerIndex }
  };

  /* ------------------------------------------------------------------
     ENGINE — scoring & persistence (kept separate from rendering so a
     future version can point this at a real API without UI changes)
     ------------------------------------------------------------------ */

  function computeScore(){
    let total = 0;
    QUESTIONS.forEach(q => {
      const idx = state.answers[q.id];
      if (idx !== undefined){
        total += q.answers[idx].points;
      }
    });
    return total;
  }

  function getRiskLevel(score){
    return RISK_LEVELS.find(r => score >= r.min && score <= r.max) || RISK_LEVELS[0];
  }

  function getTopRisks(limit){
    return QUESTIONS
      .map(q => {
        const idx = state.answers[q.id];
        if (idx === undefined) return null;
        const answer = q.answers[idx];
        return { question: q, answer, points: answer.points };
      })
      .filter(r => r && r.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, limit || 5);
  }

  function severityForPoints(points){
    if (points >= 18) return { key: 'critical', color: 'var(--risk-critical)', label: 'High' };
    if (points >= 12) return { key: 'high', color: 'var(--risk-high)', label: 'Elevated' };
    return { key: 'medium', color: 'var(--risk-medium)', label: 'Moderate' };
  }

  function saveProgress(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }catch(e){ /* localStorage unavailable — fail silently */ }
  }

  function loadProgress(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }

  function clearProgress(){
    try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
  }

  function saveLead(lead){
    // Local copy for the demo / restart flow — not the primary delivery path.
    try{
      const raw = localStorage.getItem(LEADS_KEY);
      const leads = raw ? JSON.parse(raw) : [];
      leads.push(Object.assign({}, lead, { submittedAt: new Date().toISOString(), score: computeScore() }));
      localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
    }catch(e){ /* safe to ignore — local backup only */ }
  }

  // Sends the lead to Formspree, which emails it to contact@guardora.net.
  // Returns true on success so the UI can show the right confirmation state.
  async function emailLead(lead){
    if (!LEAD_EMAIL_ENDPOINT || LEAD_EMAIL_ENDPOINT.includes('YOUR_FORM_ID')){
      console.warn('Guardora: LEAD_EMAIL_ENDPOINT is not configured — email was not sent.');
      return false;
    }
    try{
      const response = await fetch(LEAD_EMAIL_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          company: lead.company,
          email: lead.email,
          website: lead.website,
          riskScore: computeScore(),
          riskLevel: getRiskLevel(computeScore()).label,
          _subject: `New Guardora assessment lead: ${lead.company}`
        })
      });
      return response.ok;
    }catch(e){
      console.error('Guardora: failed to send lead email.', e);
      return false;
    }
  }

  /* ------------------------------------------------------------------
     UI — element refs
     ------------------------------------------------------------------ */

  const screens = {
    welcome: document.getElementById('screen-welcome'),
    assessment: document.getElementById('screen-assessment'),
    results: document.getElementById('screen-results')
  };

  const el = {
    btnStart: document.getElementById('btn-start'),
    btnResume: document.getElementById('btn-resume'),
    resumeNote: document.getElementById('resume-note'),

    progressFill: document.getElementById('progress-fill'),
    progressLabel: document.getElementById('progress-label'),
    progressCategory: document.getElementById('progress-category'),
    questionContainer: document.getElementById('question-container'),
    btnBack: document.getElementById('btn-back'),
    btnNext: document.getElementById('btn-next'),

    gaugeArc: document.getElementById('gauge-arc'),
    scoreValue: document.getElementById('score-value'),
    riskLevelTitle: document.getElementById('risk-level-title'),
    riskLevelDesc: document.getElementById('risk-level-desc'),
    riskList: document.getElementById('risk-list'),
    packageCard: document.getElementById('package-card'),
    faqList: document.getElementById('faq-list'),
    leadForm: document.getElementById('lead-form'),
    leadConfirm: document.getElementById('lead-confirm'),
    btnRestart: document.getElementById('btn-restart'),
    btnExport: document.getElementById('btn-export')
  };

  function showScreen(name){
    Object.values(screens).forEach(s => s.classList.remove('is-active'));
    screens[name].classList.add('is-active');
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  /* ------------------------------------------------------------------
     UI — questionnaire
     ------------------------------------------------------------------ */

  function renderQuestion(){
    const q = QUESTIONS[state.currentIndex];
    const selectedIdx = state.answers[q.id];

    el.progressLabel.textContent = `Question ${state.currentIndex + 1} of ${QUESTIONS.length}`;
    el.progressCategory.textContent = q.category;
    el.progressFill.style.width = `${((state.currentIndex) / QUESTIONS.length) * 100}%`;

    const answersHtml = q.answers.map((a, i) => `
      <button type="button" class="answer${i === selectedIdx ? ' is-selected' : ''}" data-index="${i}">
        <span class="answer__marker"></span>
        <span>${a.label}</span>
      </button>
    `).join('');

    el.questionContainer.innerHTML = `
      <h2 id="question-text" class="question__text">${q.text}</h2>
      <div class="answer-list">${answersHtml}</div>
      <div class="question__explainer"><span>&#9432;</span><span><b>Why it matters:</b> ${q.explanation}</span></div>
    `;

    el.questionContainer.querySelectorAll('.answer').forEach(btn => {
      btn.addEventListener('click', () => selectAnswer(q.id, Number(btn.dataset.index)));
    });

    el.btnBack.disabled = state.currentIndex === 0;
    el.btnNext.disabled = selectedIdx === undefined;
    el.btnNext.textContent = state.currentIndex === QUESTIONS.length - 1 ? 'See my results' : 'Next';
  }

  function selectAnswer(questionId, answerIndex){
    state.answers[questionId] = answerIndex;
    saveProgress();
    renderQuestion();
  }

  function goNext(){
    if (state.currentIndex < QUESTIONS.length - 1){
      state.currentIndex++;
      saveProgress();
      renderQuestion();
    } else {
      finishAssessment();
    }
  }

  function goBack(){
    if (state.currentIndex > 0){
      state.currentIndex--;
      saveProgress();
      renderQuestion();
    }
  }

  function startAssessment(){
    showScreen('assessment');
    renderQuestion();
  }

  /* ------------------------------------------------------------------
     UI — results
     ------------------------------------------------------------------ */

  const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 96; // r=96, matches SVG

  function finishAssessment(){
    el.progressFill.style.width = '100%';
    const score = computeScore();
    const level = getRiskLevel(score);

    renderResults(score, level);
    showScreen('results');
  }

  function renderResults(score, level){
    el.riskLevelTitle.textContent = level.label;
    el.riskLevelTitle.style.color = level.color;
    el.riskLevelDesc.textContent = level.desc;
    el.scoreValue.textContent = score;

    animateGauge(score, level.color);
    renderRiskList();
    renderPackage(level.key);
    renderFaq();
  }

  function animateGauge(score, color){
    // Normalize against a practical ceiling so the ring reads meaningfully
    // even for scores above 100 (the CRITICAL band is open-ended).
    const ceiling = 150;
    const pct = Math.max(0, Math.min(score / ceiling, 1));
    const offset = GAUGE_CIRCUMFERENCE * (1 - pct);

    el.gaugeArc.style.stroke = color;
    // reset then animate on next frame so the transition always fires
    el.gaugeArc.style.strokeDashoffset = GAUGE_CIRCUMFERENCE;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.gaugeArc.style.strokeDashoffset = offset;
      });
    });
  }

  function renderRiskList(){
    const topRisks = getTopRisks(5);

    if (topRisks.length === 0){
      el.riskList.innerHTML = `<p style="color:var(--text-muted);font-size:14px;">No significant risks detected in your answers \u2014 nice work. Continuous monitoring is still recommended as your setup changes.</p>`;
      return;
    }

    el.riskList.innerHTML = topRisks.map(r => {
      const sev = severityForPoints(r.points);
      return `
        <div class="risk-item" style="--sev-color:${sev.color}">
          <span class="risk-item__badge">${sev.label}</span>
          <div class="risk-item__body">
            <h4>${r.question.category}</h4>
            <p>${r.question.explanation}</p>
            <p class="risk-item__action">Fix: ${r.question.recommendedAction}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderPackage(levelKey){
    const pkg = PACKAGES[levelKey];
    el.packageCard.innerHTML = `
      <span class="package-card__tag">Recommended package</span>
      <h4 class="package-card__name">${pkg.name}</h4>
      <p class="package-card__for">${pkg.tag}</p>
      <ul class="package-card__list">
        ${pkg.items.map(i => `<li>${i}</li>`).join('')}
      </ul>
    `;
  }

  function renderFaq(){
    el.faqList.innerHTML = FAQS.map((f, i) => `
      <div class="faq-item" data-faq="${i}">
        <button type="button" class="faq-item__q">
          <span>${f.q}</span>
          <span class="faq-item__chevron">+</span>
        </button>
        <div class="faq-item__a"><div class="faq-item__a-inner">${f.a}</div></div>
      </div>
    `).join('');

    el.faqList.querySelectorAll('.faq-item').forEach(item => {
      item.querySelector('.faq-item__q').addEventListener('click', () => {
        item.classList.toggle('is-open');
      });
    });
  }

  /* ------------------------------------------------------------------
     UI — lead form
     ------------------------------------------------------------------ */

  async function handleLeadSubmit(e){
    e.preventDefault();
    const submitBtn = el.leadForm.querySelector('button[type="submit"]');
    const formData = new FormData(el.leadForm);
    const lead = {
      name: formData.get('name'),
      company: formData.get('company'),
      email: formData.get('email'),
      website: formData.get('website')
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    saveLead(lead);
    const sent = await emailLead(lead);

    if (sent){
      el.leadConfirm.textContent = 'Request received — a Guardora analyst will follow up shortly.';
      el.leadConfirm.style.color = 'var(--risk-low)';
    } else {
      // Local copy is still saved; let them know the direct email didn't go through.
      el.leadConfirm.textContent = 'Saved your request, but the email notification didn\u2019t go through. We\u2019ll still follow up — or reach us directly at contact@guardora.net.';
      el.leadConfirm.style.color = 'var(--risk-medium)';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Request Security Assessment';
    }
    el.leadConfirm.hidden = false;
  }

  /* ------------------------------------------------------------------
     UI — restart / export
     ------------------------------------------------------------------ */

  function restartAssessment(){
    state = { currentIndex: 0, answers: {} };
    clearProgress();
    el.leadForm.reset();
    el.leadConfirm.hidden = true;
    el.leadForm.querySelector('button[type="submit"]').disabled = false;
    showScreen('welcome');
  }

  function exportReport(){
    const score = computeScore();
    const level = getRiskLevel(score);
    const pkg = PACKAGES[level.key];
    const topRisks = getTopRisks(10);
    const date = new Date().toLocaleDateString();

    const reportHtml = `
      <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
      <title>Guardora Security Risk Report</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:40px auto;padding:0 20px;}
        h1{font-size:22px;margin-bottom:4px;}
        .muted{color:#666;font-size:13px;margin-top:0;}
        .score{font-size:40px;font-weight:bold;margin:20px 0 4px;}
        .level{display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;color:#fff;background:#c0392b;margin-bottom:20px;}
        .section{margin:28px 0;}
        .section h2{font-size:16px;border-bottom:1px solid #ddd;padding-bottom:6px;}
        .risk{padding:10px 0;border-bottom:1px solid #eee;}
        .risk h3{margin:0 0 4px;font-size:14px;}
        .risk p{margin:2px 0;font-size:13px;color:#444;}
        ul{padding-left:18px;}
        li{font-size:13px;margin-bottom:4px;}
      </style></head><body>
        <h1>Guardora Security Risk Report</h1>
        <p class="muted">Generated ${date}</p>
        <div class="score">${score} risk points</div>
        <div class="level">${level.label}</div>
        <p>${level.desc}</p>

        <div class="section">
          <h2>Top risks identified</h2>
          ${topRisks.map(r => `
            <div class="risk">
              <h3>${r.question.category}</h3>
              <p>${r.question.explanation}</p>
              <p><strong>Fix:</strong> ${r.question.recommendedAction}</p>
            </div>
          `).join('') || '<p>No significant risks identified.</p>'}
        </div>

        <div class="section">
          <h2>Recommended package: ${pkg.name}</h2>
          <p>${pkg.tag}</p>
          <ul>${pkg.items.map(i => `<li>${i}</li>`).join('')}</ul>
        </div>

        <div class="section">
          <p class="muted">This report was generated by the Guardora Security Risk Assessment tool and reflects self-reported answers. It is not a substitute for a full security audit.</p>
        </div>
      </body></html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guardora-security-report.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ------------------------------------------------------------------
     INIT
     ------------------------------------------------------------------ */

  function init(){
    el.btnStart.addEventListener('click', () => {
      state = { currentIndex: 0, answers: {} };
      clearProgress();
      startAssessment();
    });

    const saved = loadProgress();
    if (saved && saved.answers && Object.keys(saved.answers).length > 0){
      el.resumeNote.hidden = false;
      el.btnResume.addEventListener('click', () => {
        state = saved;
        startAssessment();
      });
    }

    el.btnNext.addEventListener('click', goNext);
    el.btnBack.addEventListener('click', goBack);
    el.leadForm.addEventListener('submit', handleLeadSubmit);
    el.btnRestart.addEventListener('click', restartAssessment);
    el.btnExport.addEventListener('click', exportReport);

    showScreen('welcome');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
