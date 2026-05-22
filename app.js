/* ===================================================
   GENCY – TRIAGE INTELIGENTE
   App Logic / app.js
   =================================================== */

'use strict';

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const appState = {
  currentScreen: 'screen-home',
  previousScreen: null,
  selectedSymptoms: new Set(),
  dollarLocation: null,
  chatMessage: '',
  isLoading: false,
  toastTimer: null,
};

// Triage logic weights
const SYMPTOM_WEIGHTS = {
  fiebre:    20,
  vomito:    15,
  respirar:  40,
  dolor:     25,
  mareado:   15,
  debilidad: 10,
};

const PAIN_LOCATION_WEIGHTS = {
  pecho:    30,
  cabeza:   15,
  estomago: 10,
};

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────
function navigateTo(screenId) {
  const current = document.getElementById(appState.currentScreen);
  const next    = document.getElementById(screenId);

  if (!next || screenId === appState.currentScreen) return;

  // Determine slide direction
  const screens = ['screen-home', 'screen-login', 'screen-dashboard', 'screen-symptoms', 'screen-results', 'screen-hospitals', 'screen-turnos'];
  const fromIdx = screens.indexOf(appState.currentScreen);
  const toIdx   = screens.indexOf(screenId);
  const goingForward = toIdx >= fromIdx;

  // Exit current screen
  current.classList.remove('screen--active');
  current.classList.add(goingForward ? 'screen--exit-left' : 'screen--exit-right');

  // Prepare next screen entrance
  next.style.transform = goingForward ? 'translateX(30px)' : 'translateX(-30px)';
  next.style.opacity   = '0';
  next.style.pointerEvents = 'none';

  // Small rAF delay to allow CSS to pick up initial state
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      next.classList.add('screen--active');
      next.style.transform = '';
      next.style.opacity   = '';
      next.style.pointerEvents = '';

      // Clean exit class after transition
      setTimeout(() => {
        current.classList.remove('screen--exit-left', 'screen--exit-right');
      }, 450);
    });
  });

  appState.previousScreen = appState.currentScreen;
  appState.currentScreen  = screenId;

  // Run screen-specific entry hooks
  onScreenEnter(screenId);
}

// Add exit-right class to CSS if not already defined
(function addExitRightStyle() {
  const style = document.createElement('style');
  style.textContent = `
    .screen--exit-right {
      opacity: 0 !important;
      transform: translateX(30px) !important;
      pointer-events: none !important;
    }
    .screen--exit-left {
      opacity: 0 !important;
      transform: translateX(-30px) !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
})();

function onScreenEnter(screenId) {
  switch (screenId) {
    case 'screen-home':
      resetHomeAnimations();
      break;
    case 'screen-dashboard':
      resetNavActive();
      setNavActive('nav-home');
      break;
    case 'screen-symptoms':
      resetSymptomsScreen();
      break;
    case 'screen-results':
      renderResults();
      break;
    case 'screen-hospitals':
      animateHospitalCards();
      break;
    default:
      break;
  }
}

// ─────────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────────
function resetHomeAnimations() {
  // Re-trigger animations by re-adding animated elements
  const animated = document.querySelectorAll('#screen-home .logo-container, #screen-home .home-header__title, #screen-home .btn-primary, #screen-home .link-underline');
  animated.forEach(el => {
    el.style.animation = 'none';
    void el.offsetHeight; // reflow
    el.style.animation = '';
  });
}

// ─────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────
function handleLogin() {
  const email    = document.getElementById('input-email').value.trim();
  const password = document.getElementById('input-password').value;

  if (!email || !password) {
    showToast('Por favor completa todos los campos.');
    shakeElement(document.getElementById('login-form'));
    return;
  }

  if (!isValidEmail(email)) {
    showToast('Ingresa un email válido.');
    shakeElement(document.getElementById('input-email'));
    return;
  }

  showLoading('Iniciando sesión...');

  // Simulate async login
  setTimeout(() => {
    hideLoading();
    showToast('¡Bienvenido a Gency! 👋');
    setTimeout(() => navigateTo('screen-dashboard'), 600);
  }, 1500);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Social login buttons
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-google')?.addEventListener('click', () => {
    showToast('Google login próximamente');
  });
  document.getElementById('btn-facebook')?.addEventListener('click', () => {
    showToast('Facebook login próximamente');
  });
  document.getElementById('btn-apple')?.addEventListener('click', () => {
    showToast('Apple login próximamente');
  });
});

// ─────────────────────────────────────────────
// SYMPTOMS SCREEN
// ─────────────────────────────────────────────
function resetSymptomsScreen() {
  // Uncheck all symptoms
  document.querySelectorAll('.symptom-checkbox, .symptom-radio').forEach(input => {
    input.checked = false;
  });

  // Collapse pain sub-items
  const subitems = document.getElementById('dolor-subitems');
  if (subitems) subitems.classList.remove('expanded');

  // Reset intensity buttons
  document.querySelectorAll('.intensity-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.textContent = '···';
  });

  // Clear chat input
  const chatInput = document.getElementById('chat-input');
  if (chatInput) chatInput.value = '';

  // Reset state
  appState.selectedSymptoms.clear();
  appState.dollarLocation = null;

  // Animate symptoms in
  animateSymptomItems();
}

function animateSymptomItems() {
  const items = document.querySelectorAll('.symptom-item');
  items.forEach((item, i) => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-12px)';
    setTimeout(() => {
      item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      item.style.opacity = '1';
      item.style.transform = 'translateX(0)';
    }, 80 + i * 60);
  });
}

// Pain expandable checkbox
document.addEventListener('DOMContentLoaded', () => {
  const dolorCheckbox = document.getElementById('checkbox-dolor');
  const dolorSubitems = document.getElementById('dolor-subitems');

  if (dolorCheckbox && dolorSubitems) {
    dolorCheckbox.addEventListener('change', () => {
      if (dolorCheckbox.checked) {
        dolorSubitems.classList.add('expanded');
        appState.selectedSymptoms.add('dolor');
      } else {
        dolorSubitems.classList.remove('expanded');
        appState.selectedSymptoms.delete('dolor');
        // Uncheck radio buttons
        document.querySelectorAll('input[name="dolor-location"]').forEach(r => {
          r.checked = false;
        });
        appState.dollarLocation = null;
      }
    });
  }

  // Track pain location selection
  document.querySelectorAll('input[name="dolor-location"]').forEach(radio => {
    radio.addEventListener('change', () => {
      appState.dollarLocation = radio.value;
    });
  });

  // Track other symptoms
  document.querySelectorAll('.symptom-checkbox:not(#checkbox-dolor)').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const symptom = checkbox.dataset.symptom;
      if (!symptom) return;
      if (checkbox.checked) {
        appState.selectedSymptoms.add(symptom);
      } else {
        appState.selectedSymptoms.delete(symptom);
      }
    });
  });

  // Chat input enter key
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleConsultar();
      }
    });
  }

  // Attach / mic buttons
  document.getElementById('btn-attach')?.addEventListener('click', () => {
    showToast('Función de adjuntar próximamente');
  });
  document.getElementById('btn-mic')?.addEventListener('click', () => {
    showToast('Función de voz próximamente');
  });
});

// ─────────────────────────────────────────────
// CONSULTAR / TRIAGE
// ─────────────────────────────────────────────
function handleConsultar() {
  const chatInput = document.getElementById('chat-input');
  const chatText  = chatInput ? chatInput.value.trim() : '';

  if (appState.selectedSymptoms.size === 0 && !chatText) {
    showToast('Selecciona al menos un síntoma o describe cómo te sientes.');
    shakeElement(document.getElementById('btn-consultar'));
    return;
  }

  showLoading('Analizando síntomas...');

  setTimeout(() => {
    hideLoading();
    calculateTriage();
    navigateTo('screen-results');
  }, 2200);
}

function calculateTriage() {
  let score = 0;

  // Add symptom weights
  appState.selectedSymptoms.forEach(symptom => {
    score += SYMPTOM_WEIGHTS[symptom] || 0;
  });

  // Add pain location weight
  if (appState.selectedSymptoms.has('dolor') && appState.dollarLocation) {
    score += PAIN_LOCATION_WEIGHTS[appState.dollarLocation] || 0;
  }

  // Store result
  appState.triageScore = score;
  appState.triageLevel = score >= 50 ? 'alta' : score >= 25 ? 'media' : 'baja';
}

// ─────────────────────────────────────────────
// RESULTS SCREEN
// ─────────────────────────────────────────────
function renderResults() {
  const badge          = document.getElementById('urgency-badge');
  const recommendation = document.getElementById('recommendation-text');

  if (!badge || !recommendation) return;

  const level = appState.triageLevel || 'media';
  const score = appState.triageScore || 0;

  // Configure badge
  badge.className = 'results-card__badge';
  badge.classList.add(`results-card__badge--${level}`);

  const config = {
    alta: {
      label: 'ALTA',
      text: '⚠️ Recomendamos atención médica inmediata. Dirígete a urgencias lo antes posible.',
    },
    media: {
      label: 'MEDIA',
      text: 'Basado en tus síntomas, recomendamos atención médica en las próximas 2 horas.',
    },
    baja: {
      label: 'BAJA',
      text: 'Tus síntomas no parecen urgentes. Puedes esperar y monitorear tu estado. Si empeoran, consulta un médico.',
    },
  };

  badge.textContent          = config[level].label;
  recommendation.textContent = config[level].text;

  // Animate results card
  const card = document.querySelector('.results-card');
  if (card) {
    card.style.animation = 'none';
    void card.offsetHeight;
    card.style.animation = 'slideInUp 0.6s ease both';
  }
}

// ─────────────────────────────────────────────
// SOLICITAR TURNO
// ─────────────────────────────────────────────
function handleSolicitarTurno() {
  showLoading('Reservando turno...');
  setTimeout(() => {
    hideLoading();
    showToast('✅ Turno solicitado en Hospital San Ignacio');
    setTimeout(() => navigateTo('screen-dashboard'), 1200);
  }, 1800);
}

// ─────────────────────────────────────────────
// DASHBOARD FUNCTIONS
// ─────────────────────────────────────────────
function setNavActive(navId) {
  document.querySelectorAll('.bottom-nav__item').forEach(btn => {
    btn.classList.remove('bottom-nav__item--active');
  });
  const active = document.getElementById(navId);
  if (active) active.classList.add('bottom-nav__item--active');
}

function resetNavActive() {
  document.querySelectorAll('.bottom-nav__item').forEach(btn => {
    btn.classList.remove('bottom-nav__item--active');
  });
}

// ─────────────────────────────────────────────
// TURNOS SLIDE PANEL
// ─────────────────────────────────────────────
function toggleTurnosPanel() {
  const panel   = document.getElementById('turnos-panel');
  const overlay = document.getElementById('turnos-overlay');
  if (!panel || !overlay) return;

  const isOpen = panel.classList.contains('turnos-panel--open');
  if (isOpen) {
    panel.classList.remove('turnos-panel--open');
    overlay.classList.remove('turnos-overlay--visible');
  } else {
    panel.classList.add('turnos-panel--open');
    overlay.classList.add('turnos-overlay--visible');
  }
}

// ─────────────────────────────────────────────
// HOSPITALS SCREEN
// ─────────────────────────────────────────────
function animateHospitalCards() {
  const cards = document.querySelectorAll('.hosp-card');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 80 + i * 100);
  });
}

function filterHospitals(query) {
  const cards = document.querySelectorAll('.hosp-card');
  const q = query.toLowerCase().trim();
  cards.forEach(card => {
    const name = card.querySelector('.hosp-card__name')?.textContent.toLowerCase() || '';
    const addr = card.querySelector('.hosp-card__address')?.textContent.toLowerCase() || '';
    if (!q || name.includes(q) || addr.includes(q)) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

let hospScrollIndex = 0;
function scrollHospitals(dir) {
  const list = document.getElementById('hosp-list');
  if (!list) return;
  const cards = list.querySelectorAll('.hosp-card');
  hospScrollIndex = Math.max(0, Math.min(cards.length - 1, hospScrollIndex + dir));
  cards[hospScrollIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─────────────────────────────────────────────
// INTENSITY TOGGLE (pain subitems)
// ─────────────────────────────────────────────
function toggleIntensity(btn) {
  const levels = ['···', 'LEVE', 'MODERADO', 'SEVERO'];
  const idx    = levels.indexOf(btn.textContent);
  const next   = levels[(idx + 1) % levels.length];
  btn.textContent = next;

  if (next === '···') {
    btn.classList.remove('active');
  } else {
    btn.classList.add('active');
  }
}

// ─────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ─────────────────────────────────────────────
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  // Clear existing timer
  if (appState.toastTimer) {
    clearTimeout(appState.toastTimer);
    toast.classList.remove('toast--visible');
  }

  toast.textContent = message;

  // Force reflow before adding visible class
  void toast.offsetHeight;
  toast.classList.add('toast--visible');

  appState.toastTimer = setTimeout(() => {
    toast.classList.remove('toast--visible');
    appState.toastTimer = null;
  }, duration);
}

// ─────────────────────────────────────────────
// LOADING OVERLAY
// ─────────────────────────────────────────────
function showLoading(text = 'Cargando...') {
  const overlay     = document.getElementById('loading-overlay');
  const loadingText = overlay?.querySelector('.loading-text');

  if (!overlay) return;

  if (loadingText) loadingText.textContent = text;
  overlay.classList.add('loading-overlay--visible');
  appState.isLoading = true;
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;

  overlay.classList.remove('loading-overlay--visible');
  appState.isLoading = false;
}

// ─────────────────────────────────────────────
// MICRO-INTERACTIONS
// ─────────────────────────────────────────────
function shakeElement(el) {
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetHeight;

  // Inject shake keyframes if not already there
  if (!document.getElementById('shake-style')) {
    const style = document.createElement('style');
    style.id = 'shake-style';
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%       { transform: translateX(-8px); }
        40%       { transform: translateX(8px); }
        60%       { transform: translateX(-5px); }
        80%       { transform: translateX(5px); }
      }
      .shake { animation: shake 0.45s ease both !important; }
    `;
    document.head.appendChild(style);
  }

  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 500);
}

// Ripple effect on buttons
function addRipple(e) {
  const btn    = e.currentTarget;
  const circle = document.createElement('span');
  const rect   = btn.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height);

  circle.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${e.clientX - rect.left - size / 2}px;
    top: ${e.clientY - rect.top - size / 2}px;
    background: rgba(255,255,255,0.3);
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 0.55s linear;
    pointer-events: none;
  `;

  if (!document.getElementById('ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `
      @keyframes ripple {
        to { transform: scale(2.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Attach ripple to primary action buttons
  document.querySelectorAll('.btn-primary, .btn-dark, .btn-consult, .btn-outline').forEach(btn => {
    btn.addEventListener('click', addRipple);
  });

  // Keyboard navigation: ESC goes back
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && appState.previousScreen) {
      navigateTo(appState.previousScreen);
    }
  });

  // Swipe gesture support (touch devices)
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const deltaX = e.changedTouches[0].screenX - touchStartX;
    const deltaY = Math.abs(e.changedTouches[0].screenY - touchStartY);

    // Horizontal swipe right (> 80px) and not vertical
    if (deltaX > 80 && deltaY < 60 && appState.previousScreen) {
      navigateTo(appState.previousScreen);
    }
  }, { passive: true });

  console.log('%cGency Triage Inteligente 🩺', 'color:#1A9E8F;font-size:16px;font-weight:bold;');
  console.log('%cDecide a tiempo, cuida mejor.', 'color:#5CE0C8;font-size:12px;');
});
