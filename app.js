/* =====================================================
   XcuseMe – App Logic + Audio Engine (MP3 + Synth)
   ===================================================== */

'use strict';

/* ---- State ---- */
const state = {
    meetingMinutes: 45,
    graceMinutes: 10,
    startTime: null,
    timerInterval: null,
    phase: 'idle',       // idle | meeting | grace | done
    emergencyShown: false,
    currentAudio: null,  // HTMLAudioElement for MP3
    currentExcuseId: null,
    soundsVisible: false,
};

/* =====================================================
   AUDIO ENGINE – MP3 files via HTMLAudioElement
   ===================================================== */

const SOUND_DIR = 'Sounds/';

function stopAllAudio() {
    if (state.currentAudio) {
        state.currentAudio.pause();
        state.currentAudio.currentTime = 0;
        state.currentAudio = null;
    }
    state.currentExcuseId = null;
    hideNowPlayingBar();
    // remove playing class from all cards
    document.querySelectorAll('.excuse-card.playing, .mini-sound-card.playing')
        .forEach(c => {
            c.classList.remove('playing');
            const pp = c.querySelector('.excuse-pp-btn, .mini-pp-btn');
            if (pp) pp.textContent = '▶';
        });
}

function playExcuse(excuse) {
    // If same excuse is playing → pause it
    if (state.currentExcuseId === excuse.id && state.currentAudio && !state.currentAudio.paused) {
        state.currentAudio.pause();
        state.currentExcuseId = null;
        hideNowPlayingBar();
        // Update all cards for this excuse
        document.querySelectorAll(`[data-excuse-id="${excuse.id}"]`).forEach(card => {
            card.classList.remove('playing');
            const pp = card.querySelector('.excuse-pp-btn, .mini-pp-btn');
            if (pp) pp.textContent = '▶';
        });
        return;
    }

    // Stop whatever is playing
    stopAllAudio();

    // Create audio
    const audio = new Audio(SOUND_DIR + excuse.file);
    audio.volume = 0.85;
    state.currentAudio = audio;
    state.currentExcuseId = excuse.id;

    audio.play().catch(e => console.warn('Audio play error:', e));

    audio.addEventListener('ended', () => {
        state.currentExcuseId = null;
        state.currentAudio = null;
        hideNowPlayingBar();
        document.querySelectorAll(`[data-excuse-id="${excuse.id}"]`).forEach(card => {
            card.classList.remove('playing');
            const pp = card.querySelector('.excuse-pp-btn, .mini-pp-btn');
            if (pp) pp.textContent = '▶';
        });
    });

    // Update all cards for this excuse
    document.querySelectorAll(`[data-excuse-id="${excuse.id}"]`).forEach(card => {
        card.classList.add('playing');
        const pp = card.querySelector('.excuse-pp-btn, .mini-pp-btn');
        if (pp) pp.textContent = '⏸';
    });

    showNowPlayingBar(excuse);
}

/* =====================================================
   EXCUSE DATA — ordered: big ones first
   ===================================================== */
const EXCUSES = [
    {
        id: 'world-war',
        emoji: '💣',
        name: 'World War Start',
        desc: 'When only history-level chaos can excuse you',
        file: 'worldwarstart.mp3',
        gradient: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(120,0,0,0.12))',
        accent: '#ef4444',
        shadow: 'rgba(239,68,68,0.3)',
    },
    {
        id: 'bomb-drop',
        emoji: '💥',
        name: 'Bomb Drop',
        desc: 'The most dramatic exit in history',
        file: 'bomb drop.mp3',
        gradient: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(239,68,68,0.1))',
        accent: '#f97316',
        shadow: 'rgba(249,115,22,0.3)',
    },
    {
        id: 'internet',
        emoji: '📡',
        name: 'Internet Disturbance',
        desc: '"Hello? Can you hear me? I think my connection–"',
        file: 'internet disturbance.mp3',
        gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(14,165,233,0.08))',
        accent: '#06b6d4',
        shadow: 'rgba(6,182,212,0.2)',
    },
    {
        id: 'dog-barking',
        emoji: '🐕',
        name: 'Dog Barking',
        desc: 'My pup is going absolutely feral',
        file: 'dog.mp3',
        gradient: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(234,179,8,0.08))',
        accent: '#fbbf24',
        shadow: 'rgba(251,191,36,0.2)',
    },
    {
        id: 'cat-fight',
        emoji: '🐱',
        name: 'Cat Fight',
        desc: 'Neighbourhood cats are at war again',
        file: 'cat.mp3',
        gradient: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.08))',
        accent: '#a855f7',
        shadow: 'rgba(168,85,247,0.2)',
    },
    {
        id: 'glass-break',
        emoji: '🪟',
        name: 'Glass Shattering',
        desc: 'Something fell. BIG. Gotta check',
        file: 'glassbreak.mp3',
        gradient: 'linear-gradient(135deg, rgba(148,163,184,0.15), rgba(100,116,139,0.08))',
        accent: '#94a3b8',
        shadow: 'rgba(148,163,184,0.2)',
    },
    {
        id: 'kid-crying',
        emoji: '😭',
        name: 'Kid Crying',
        desc: 'Someone is VERY unhappy right now',
        file: 'baby.mp3',
        gradient: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.08))',
        accent: '#fb923c',
        shadow: 'rgba(249,115,22,0.2)',
    },
    {
        id: 'door-knock',
        emoji: '🚪',
        name: 'Door Knocking',
        desc: 'Someone is urgently at the door',
        file: 'doorknocking.mp3',
        gradient: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.08))',
        accent: '#22c55e',
        shadow: 'rgba(34,197,94,0.2)',
    },
    {
        id: 'phone-ring',
        emoji: '📞',
        name: 'Phone Ringing',
        desc: 'Important call I must take right now',
        file: null, // synthesized
        gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.08))',
        accent: '#3b82f6',
        shadow: 'rgba(59,130,246,0.2)',
        synth: playPhoneRinging,
    },
    {
        id: 'doorbell',
        emoji: '🔔',
        name: 'Doorbell',
        desc: 'Package delivery! Priority! Bye!',
        file: 'doorbell.mp3',
        gradient: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))',
        accent: '#10b981',
        shadow: 'rgba(16,185,129,0.2)',
    },
];

/* =====================================================
   SYNTHESIZED FALLBACK – Phone Ringing (Web Audio)
   ===================================================== */
let _synthCtx = null;
let _synthSource = null;

function getSynthCtx() {
    if (!_synthCtx || _synthCtx.state === 'closed') {
        _synthCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_synthCtx.state === 'suspended') _synthCtx.resume();
    return _synthCtx;
}

function stopSynth() {
    try { _synthSource && _synthSource.stop(); } catch (e) { }
    _synthSource = null;
}

function playPhoneRinging() {
    const ctx = getSynthCtx();
    stopSynth();
    const duration = 5;
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;
    masterGain.gain.setTargetAtTime(0, ctx.currentTime + duration - 0.3, 0.15);
    masterGain.connect(ctx.destination);

    const rings = [0, 0.4, 1.4, 1.8, 2.8, 3.2, 4.2, 4.6];
    rings.forEach(t => {
        const now = ctx.currentTime + t;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const env = ctx.createGain();
        osc1.type = 'sine'; osc1.frequency.value = 440;
        osc2.type = 'sine'; osc2.frequency.value = 480;
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.8, now + 0.02);
        env.gain.setValueAtTime(0.8, now + 0.3);
        env.gain.linearRampToValueAtTime(0, now + 0.35);
        const mix = ctx.createGain(); mix.gain.value = 0.5;
        osc1.connect(mix); osc2.connect(mix); mix.connect(env); env.connect(masterGain);
        osc1.start(now); osc2.start(now);
        osc1.stop(now + 0.4); osc2.stop(now + 0.4);
    });

    _synthSource = { stop: stopSynth };
}

/* =====================================================
   EXCUSE CARD PLAY LOGIC (handles both MP3 and synth)
   ===================================================== */

function triggerExcuse(excuse) {
    if (excuse.file) {
        // MP3-based
        playExcuse(excuse);
    } else if (excuse.synth) {
        // If the synth excuse is "playing" (we track differently)
        const isSame = state.currentExcuseId === excuse.id;
        stopAllAudio();
        stopSynth();
        if (isSame) return; // was playing, just stop
        state.currentExcuseId = excuse.id;
        excuse.synth();
        document.querySelectorAll(`[data-excuse-id="${excuse.id}"]`).forEach(card => {
            card.classList.add('playing');
            const pp = card.querySelector('.excuse-pp-btn, .mini-pp-btn');
            if (pp) pp.textContent = '⏸';
        });
        showNowPlayingBar(excuse);
        const dur = 5500;
        setTimeout(() => {
            if (state.currentExcuseId === excuse.id) {
                state.currentExcuseId = null;
                hideNowPlayingBar();
                document.querySelectorAll(`[data-excuse-id="${excuse.id}"]`).forEach(card => {
                    card.classList.remove('playing');
                    const pp = card.querySelector('.excuse-pp-btn, .mini-pp-btn');
                    if (pp) pp.textContent = '▶';
                });
            }
        }, dur);
    }
}

/* =====================================================
   NOW PLAYING BAR
   ===================================================== */
function showNowPlayingBar(excuse) {
    const bar = document.getElementById('now-playing');
    document.getElementById('np-icon').textContent = excuse.emoji;
    document.getElementById('np-name').textContent = excuse.name;
    bar.classList.remove('hidden');
    requestAnimationFrame(() => bar.classList.add('visible'));
}
function hideNowPlayingBar() {
    const bar = document.getElementById('now-playing');
    bar.classList.remove('visible');
    setTimeout(() => bar.classList.add('hidden'), 400);
}

/* =====================================================
   BUILD FULL EXCUSE GRID (Screen 3)
   ===================================================== */
function buildExcuseGrid() {
    const grid = document.getElementById('excuse-grid');
    grid.innerHTML = '';
    EXCUSES.forEach(excuse => {
        const card = document.createElement('div');
        card.className = 'excuse-card';
        card.id = `excuse-card-${excuse.id}`;
        card.dataset.excuseId = excuse.id;
        card.style.setProperty('--card-gradient', excuse.gradient);
        card.style.setProperty('--card-accent', excuse.accent);
        card.style.setProperty('--card-shadow', excuse.shadow);

        card.innerHTML = `
      <div class="excuse-emoji">${excuse.emoji}</div>
      <div class="excuse-name">${excuse.name}</div>
      <div class="excuse-desc">${excuse.desc}</div>
      <div class="excuse-pp-row">
        <button class="excuse-pp-btn" title="Play/Pause">▶</button>
        <div class="excuse-card-wave">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>
    `;

        // Play/Pause button
        const ppBtn = card.querySelector('.excuse-pp-btn');
        ppBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerExcuse(excuse);
        });

        // Click card body (not button) also triggers
        card.addEventListener('click', (e) => {
            if (e.target === ppBtn) return;
            triggerExcuse(excuse);
        });

        grid.appendChild(card);
    });
}

/* =====================================================
   BUILD POPOUT SOUND GRID (mini cards)
   ===================================================== */
function buildPopoutSoundGrid() {
    const grid = document.getElementById('popout-sounds-grid');
    grid.innerHTML = '';
    EXCUSES.forEach(excuse => {
        const card = document.createElement('div');
        card.className = 'mini-sound-card';
        card.dataset.excuseId = excuse.id;
        card.style.setProperty('--card-gradient', excuse.gradient);
        card.style.setProperty('--card-accent', excuse.accent);
        card.style.setProperty('--card-shadow', excuse.shadow);

        card.innerHTML = `
      <span class="mini-emoji">${excuse.emoji}</span>
      <span class="mini-name">${excuse.name}</span>
      <div class="mini-wave"><span></span><span></span><span></span><span></span></div>
      <button class="mini-pp-btn" title="Play/Pause">▶</button>
    `;

        const ppBtn = card.querySelector('.mini-pp-btn');
        ppBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerExcuse(excuse);
        });
        card.addEventListener('click', (e) => {
            if (e.target === ppBtn) return;
            triggerExcuse(excuse);
        });

        grid.appendChild(card);
    });
}

/* =====================================================
   TIMER LOGIC
   ===================================================== */
const CIRCUMFERENCE = 603.19;

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}
function formatClock(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateTimerUI() {
    if (!state.startTime) return;
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const meetingSecs = state.meetingMinutes * 60;
    const graceSecs = state.graceMinutes * 60;
    const totalSecs = meetingSecs + graceSecs;

    const timeEl = document.getElementById('timer-time');
    const phaseEl = document.getElementById('timer-phase');
    const ringProgress = document.getElementById('ring-progress');
    const ringGrace = document.getElementById('ring-grace');
    const popoutTime = document.getElementById('popout-time');
    const popoutPhase = document.getElementById('popout-phase');
    const popoutTimerMini = document.getElementById('popout-timer-mini');

    if (elapsed < meetingSecs) {
        state.phase = 'meeting';
        const remaining = meetingSecs - elapsed;
        const display = formatTime(remaining);
        timeEl.textContent = display;
        phaseEl.textContent = 'In Meeting';
        phaseEl.className = 'timer-phase';
        if (popoutTime) { popoutTime.textContent = display; popoutTime.style.color = '#fff'; }
        if (popoutPhase) { popoutPhase.textContent = 'In Meeting'; popoutPhase.className = 'popout-phase'; }
        if (popoutTimerMini) popoutTimerMini.textContent = display;

        const fraction = elapsed / meetingSecs;
        ringProgress.style.strokeDashoffset = CIRCUMFERENCE * (1 - fraction);
        ringProgress.style.stroke = '#7c6dfa';
        ringGrace.style.strokeDashoffset = CIRCUMFERENCE;
        state.emergencyShown = false;

    } else if (elapsed < totalSecs) {
        state.phase = 'grace';
        const overrun = elapsed - meetingSecs;
        const display = `+${formatTime(overrun)}`;
        timeEl.textContent = display;
        phaseEl.textContent = 'Running Over!';
        phaseEl.className = 'timer-phase grace';
        if (popoutTime) { popoutTime.textContent = display; popoutTime.style.color = '#f97316'; }
        if (popoutPhase) { popoutPhase.textContent = 'Running Over!'; popoutPhase.className = 'popout-phase grace'; }
        if (popoutTimerMini) popoutTimerMini.textContent = display;

        ringProgress.style.strokeDashoffset = 0;
        ringProgress.style.stroke = '#22c55e';
        ringGrace.style.strokeDashoffset = CIRCUMFERENCE * (1 - (overrun / graceSecs));

        if (!state.emergencyShown) {
            state.emergencyShown = true;
            document.getElementById('emergency-toast').classList.remove('hidden');
        }
    } else {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
        state.phase = 'done';
        goToExcuses();
    }
}

function startTimer() {
    state.startTime = Date.now();
    state.emergencyShown = false;
    state.phase = 'meeting';

    const meetingEnd = new Date(state.startTime + state.meetingMinutes * 60000);
    const excuseStart = new Date(state.startTime + (state.meetingMinutes + state.graceMinutes) * 60000);
    document.getElementById('meta-ends').textContent = formatClock(meetingEnd);
    document.getElementById('meta-excuses').textContent = formatClock(excuseStart);

    const mins = state.meetingMinutes;
    document.getElementById('meeting-info-label').textContent =
        `Meeting · ${mins >= 60 ? (mins % 60 === 0 ? mins / 60 + 'hr' : (mins / 60).toFixed(1) + 'hr') : mins + ' min'}`;

    document.getElementById('ring-progress').style.strokeDashoffset = CIRCUMFERENCE;
    document.getElementById('ring-grace').style.strokeDashoffset = CIRCUMFERENCE;

    updateTimerUI();
    state.timerInterval = setInterval(updateTimerUI, 1000);
}

/* =====================================================
   SCREENS
   ===================================================== */
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    requestAnimationFrame(() => {
        const target = document.getElementById(id);
        if (target) target.classList.add('active');
    });

    // Show/hide popout
    const popout = document.getElementById('xcuseme-popout');
    if (id === 'screen-timer') {
        buildPopoutSoundGrid();
        popout.classList.remove('hidden');
    } else {
        popout.classList.add('hidden');
        // hide sounds panel too
        state.soundsVisible = false;
        document.getElementById('popout-sounds').classList.add('hidden');
        document.getElementById('xcuseme-cta-btn').classList.remove('active');
    }
}

function goToExcuses() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    document.getElementById('emergency-toast').classList.add('hidden');
    buildExcuseGrid();
    showScreen('screen-excuses');
}

/* =====================================================
   SETUP SCREEN EVENTS
   ===================================================== */
(function initSetup() {
    const durGrid = document.getElementById('meeting-duration-grid');
    const customWrap = document.getElementById('custom-dur-wrap');
    const customInput = document.getElementById('custom-dur-input');

    durGrid.querySelectorAll('.dur-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            durGrid.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.value === 'custom') {
                customWrap.classList.remove('hidden');
                customInput.focus();
                state.meetingMinutes = parseInt(customInput.value) || 45;
            } else {
                customWrap.classList.add('hidden');
                state.meetingMinutes = parseInt(btn.dataset.value);
            }
        });
    });

    customInput.addEventListener('input', () => {
        state.meetingMinutes = parseInt(customInput.value) || 1;
    });

    document.getElementById('grace-period-grid').querySelectorAll('.grace-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.grace-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.graceMinutes = parseInt(btn.dataset.value);
        });
    });

    document.getElementById('start-btn').addEventListener('click', () => {
        if (document.querySelector('.dur-btn[data-value="custom"].active')) {
            const val = parseInt(customInput.value);
            if (!val || val < 1 || val > 480) {
                customInput.style.outline = '2px solid #ef4444';
                customInput.focus();
                return;
            }
            state.meetingMinutes = val;
        }
        showScreen('screen-timer');
        setTimeout(startTimer, 200);
    });
})();

/* =====================================================
   TIMER SCREEN EVENTS
   ===================================================== */
document.getElementById('back-btn').addEventListener('click', () => {
    clearInterval(state.timerInterval); state.timerInterval = null;
    stopAllAudio(); stopSynth();
    document.getElementById('emergency-toast').classList.add('hidden');
    showScreen('screen-setup');
});

document.getElementById('stop-btn').addEventListener('click', () => {
    clearInterval(state.timerInterval); state.timerInterval = null;
    stopAllAudio(); stopSynth();
    document.getElementById('emergency-toast').classList.add('hidden');
    showScreen('screen-setup');
});

document.getElementById('toast-cta-btn').addEventListener('click', () => goToExcuses());

/* =====================================================
   EXCUSES SCREEN EVENTS
   ===================================================== */
document.getElementById('new-meeting-btn').addEventListener('click', () => {
    stopAllAudio(); stopSynth();
    showScreen('screen-setup');
});

document.getElementById('np-stop').addEventListener('click', () => {
    stopAllAudio(); stopSynth();
});

/* =====================================================
   FLOATING POPOUT – XcuseMe CTA & Toggle
   ===================================================== */

// Toggle sound panel
document.getElementById('xcuseme-cta-btn').addEventListener('click', () => {
    state.soundsVisible = !state.soundsVisible;
    const panel = document.getElementById('popout-sounds');
    const btn = document.getElementById('xcuseme-cta-btn');
    if (state.soundsVisible) {
        panel.classList.remove('hidden');
        btn.classList.add('active');
        btn.querySelector('span:last-child').textContent = 'Hide Excuses';
    } else {
        panel.classList.add('hidden');
        btn.classList.remove('active');
        btn.querySelector('span:last-child').textContent = 'XcuseMe';
    }
});

// Toggle sounds via 🎵 button
document.getElementById('popout-toggle-sounds').addEventListener('click', () => {
    document.getElementById('xcuseme-cta-btn').click();
});

// Collapse / Expand
document.getElementById('popout-collapse-btn').addEventListener('click', () => {
    const popout = document.getElementById('xcuseme-popout');
    const body = document.getElementById('popout-body');
    const colInfo = document.getElementById('popout-collapsed-info');
    const colBtn = document.getElementById('popout-collapse-btn');

    const isCollapsed = popout.classList.contains('collapsed');
    if (isCollapsed) {
        popout.classList.remove('collapsed');
        body.classList.remove('hidden');
        colInfo.classList.add('hidden');
        colBtn.textContent = '−';
    } else {
        popout.classList.add('collapsed');
        body.classList.add('hidden');
        colInfo.classList.remove('hidden');
        colBtn.textContent = '+';
    }
});

/* =====================================================
   DRAGGABLE POPOUT
   ===================================================== */
(function initDraggable() {
    const popout = document.getElementById('xcuseme-popout');
    const handle = document.getElementById('popout-header');

    let isDragging = false;
    let startX, startY, initLeft, initTop;

    function getPopoutRect() {
        return popout.getBoundingClientRect();
    }

    // Convert to fixed left/top positioning
    function ensureAbsolutePos() {
        if (!popout.style.left) {
            const rect = getPopoutRect();
            popout.style.left = rect.left + 'px';
            popout.style.top = rect.top + 'px';
            popout.style.right = 'auto';
            popout.style.bottom = 'auto';
        }
    }

    handle.addEventListener('mousedown', (e) => {
        // Don't drag if clicking buttons inside header
        if (e.target.closest('button')) return;
        isDragging = true;
        ensureAbsolutePos();
        startX = e.clientX;
        startY = e.clientY;
        initLeft = parseInt(popout.style.left) || 0;
        initTop = parseInt(popout.style.top) || 0;
        popout.classList.add('dragging');
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newLeft = initLeft + dx;
        const newTop = initTop + dy;
        // Clamp within viewport
        const rect = getPopoutRect();
        const clampedLeft = Math.max(0, Math.min(newLeft, window.innerWidth - rect.width));
        const clampedTop = Math.max(0, Math.min(newTop, window.innerHeight - rect.height));
        popout.style.left = clampedLeft + 'px';
        popout.style.top = clampedTop + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            popout.classList.remove('dragging');
        }
    });

    // Touch support
    handle.addEventListener('touchstart', (e) => {
        if (e.target.closest('button')) return;
        isDragging = true;
        ensureAbsolutePos();
        const t = e.touches[0];
        startX = t.clientX; startY = t.clientY;
        initLeft = parseInt(popout.style.left) || 0;
        initTop = parseInt(popout.style.top) || 0;
        popout.classList.add('dragging');
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const t = e.touches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        const rect = getPopoutRect();
        const newLeft = Math.max(0, Math.min(initLeft + dx, window.innerWidth - rect.width));
        const newTop = Math.max(0, Math.min(initTop + dy, window.innerHeight - rect.height));
        popout.style.left = newLeft + 'px';
        popout.style.top = newTop + 'px';
    }, { passive: true });

    document.addEventListener('touchend', () => {
        isDragging = false;
        popout.classList.remove('dragging');
    });
})();

/* =====================================================
   KEYBOARD SHORTCUT
   ===================================================== */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { stopAllAudio(); stopSynth(); }
});
