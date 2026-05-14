/**
 * ============================================
 * BEFREC Y ASOCIADOS SAS - Script Principal
 * Asesoría Contable y Tributaria
 * ============================================
 *
 * Funcionalidades:
 * - Navegación móvil (menú hamburguesa)
 * - Smooth scroll para enlaces internos
 * - Validación de formularios con sanitización
 * - Animaciones de scroll (Intersection Observer)
 * - WhatsApp flotante
 * - Tooltips de redes sociales
 *
 * Seguridad implementada:
 * - Validación de datos de entrada
 * - Protección XSS (textContent en lugar de innerHTML)
 * - Sanitización de formularios
 * - CSP compatible (sin eval, sin inline scripts peligrosos)
 */

'use strict';

// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================

const BEFREC = {
    name: 'Befrec y Asociados SAS',
    url: window.location.origin,
    whatsapp: '573123206293',
    email: 'contacto@befrec.com',
    address: 'Cra 88d 6d 27, Bogotá, Colombia',
    phone: '3160444428',
    mobileBreakpoint: 950,

    // Patrones de validación
    patterns: {
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        phone: /^\+?[\d\s\-\(\)]{7,20}$/,
        name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,100}$/
    }
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMobileDropdowns();
    initSmoothScroll();
    initFormValidation();
    initCustomSelect();
    initScrollAnimations();
    initWhatsAppButton();
    initTestimonialSlider();
    showCookieBanner();
});

// ============================================
// SELECT CUSTOM (cross-browser consistente)
// Reemplaza visualmente los <select> manteniendo
// el elemento nativo para el envio del formulario.
// ============================================

function initCustomSelect() {
    const selects = document.querySelectorAll('select.form-input, select.form-select');
    selects.forEach(buildCustomSelect);
}

function buildCustomSelect(nativeSelect) {
    if (nativeSelect.dataset.customized === 'true') return;
    nativeSelect.dataset.customized = 'true';

    // ── Contenedor ──────────────────────────
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';

    // ── Boton trigger (lo que ve el usuario) ─
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-labelledby', nativeSelect.id ? nativeSelect.id + '-label' : '');

    const triggerText = document.createElement('span');
    triggerText.className = 'custom-select-text';
    trigger.appendChild(triggerText);

    const arrow = document.createElement('span');
    arrow.className = 'custom-select-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.innerHTML = '&#9662;'; // triangulo abajo
    trigger.appendChild(arrow);

    // ── Lista de opciones ───────────────────
    const list = document.createElement('ul');
    list.className = 'custom-select-options';
    list.setAttribute('role', 'listbox');
    list.tabIndex = -1;

    const optionEls = [];
    Array.from(nativeSelect.options).forEach((opt, i) => {
        const li = document.createElement('li');
        li.className = 'custom-select-option';
        li.setAttribute('role', 'option');
        li.dataset.value = opt.value;
        li.textContent = opt.textContent;
        li.tabIndex = -1;
        if (opt.value === '') li.classList.add('placeholder');
        if (i === nativeSelect.selectedIndex) {
            li.classList.add('selected');
            li.setAttribute('aria-selected', 'true');
            triggerText.textContent = opt.textContent;
            if (opt.value === '') trigger.classList.add('is-placeholder');
        }
        li.addEventListener('click', () => choose(opt.value));
        list.appendChild(li);
        optionEls.push(li);
    });

    // ── Logica de seleccion ──────────────────
    function choose(value) {
        nativeSelect.value = value;
        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        const i = nativeSelect.selectedIndex;
        triggerText.textContent = nativeSelect.options[i].textContent;
        trigger.classList.toggle('is-placeholder', value === '');
        optionEls.forEach(li => {
            const isSel = li.dataset.value === value;
            li.classList.toggle('selected', isSel);
            li.setAttribute('aria-selected', isSel ? 'true' : 'false');
        });
        close();
    }

    function open() {
        // Cerrar cualquier otro select abierto
        document.querySelectorAll('.custom-select.open').forEach(el => {
            if (el !== wrapper) el.classList.remove('open');
        });
        wrapper.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        const selected = list.querySelector('.selected') || optionEls[0];
        if (selected) {
            selected.focus();
            scrollIntoView(selected);
        }
    }

    function close() {
        wrapper.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
    }

    function toggle() {
        wrapper.classList.contains('open') ? close() : open();
    }

    function scrollIntoView(el) {
        const r = el.getBoundingClientRect();
        const lr = list.getBoundingClientRect();
        if (r.bottom > lr.bottom) list.scrollTop += r.bottom - lr.bottom;
        else if (r.top < lr.top) list.scrollTop -= lr.top - r.top;
    }

    function focusOption(direction) {
        const current = document.activeElement;
        let idx = optionEls.indexOf(current);
        if (idx === -1) idx = optionEls.findIndex(o => o.classList.contains('selected'));
        idx = idx + direction;
        if (idx < 0) idx = optionEls.length - 1;
        if (idx >= optionEls.length) idx = 0;
        optionEls[idx].focus();
        scrollIntoView(optionEls[idx]);
    }

    // ── Eventos teclado / mouse ──────────────
    trigger.addEventListener('click', toggle);

    trigger.addEventListener('keydown', (e) => {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
            open();
        }
    });

    list.addEventListener('keydown', (e) => {
        const active = document.activeElement;
        if (e.key === 'Escape') { e.preventDefault(); close(); trigger.focus(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); focusOption(1); }
        else if (e.key === 'ArrowUp')   { e.preventDefault(); focusOption(-1); }
        else if (e.key === 'Home')      { e.preventDefault(); optionEls[0].focus(); }
        else if (e.key === 'End')       { e.preventDefault(); optionEls[optionEls.length - 1].focus(); }
        else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (active && active.classList.contains('custom-select-option')) {
                choose(active.dataset.value);
                trigger.focus();
            }
        } else if (e.key === 'Tab') {
            close();
        }
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) close();
    });

    // Sincronizar si cambia el nativo programaticamente
    nativeSelect.addEventListener('change', () => {
        if (nativeSelect.value !== getCurrentDisplayValue()) {
            const opt = nativeSelect.options[nativeSelect.selectedIndex];
            triggerText.textContent = opt.textContent;
            trigger.classList.toggle('is-placeholder', opt.value === '');
            optionEls.forEach(li => {
                const isSel = li.dataset.value === opt.value;
                li.classList.toggle('selected', isSel);
                li.setAttribute('aria-selected', isSel ? 'true' : 'false');
            });
        }
    });

    function getCurrentDisplayValue() {
        const sel = list.querySelector('.selected');
        return sel ? sel.dataset.value : '';
    }

    // ── Insertar en el DOM, ocultar nativo ──
    wrapper.appendChild(trigger);
    wrapper.appendChild(list);

    nativeSelect.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    nativeSelect.setAttribute('aria-hidden', 'true');
    nativeSelect.tabIndex = -1;

    nativeSelect.parentNode.insertBefore(wrapper, nativeSelect.nextSibling);
}

// ============================================
// NAVEGACIÓN - Menú responsive
// ============================================

let navMenu = null;
let menuToggleBtn = null;

function initNavigation() {
    navMenu = document.querySelector('.nav-menu');
    menuToggleBtn = document.querySelector('.menu-toggle');

    if (!navMenu || !menuToggleBtn) return;

    menuToggleBtn.addEventListener('click', toggleMenu);

    // Cerrar menú al redimensionar
    window.addEventListener('resize', () => {
        if (window.innerWidth > BEFREC.mobileBreakpoint && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    // Cerrar menú con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
            menuToggleBtn.focus();
        }
    });
}

function toggleMenu() {
    if (navMenu.classList.contains('active')) {
        closeMenu();
    } else {
        openMenu();
    }
}

function openMenu() {
    navMenu.classList.add('active');
    menuToggleBtn.setAttribute('aria-expanded', 'true');
    animateMenuIcon(true);
}

function closeMenu() {
    navMenu.classList.remove('active');
    menuToggleBtn.setAttribute('aria-expanded', 'false');
    animateMenuIcon(false);
}

// Mobile dropdown toggling: first tap opens, second tap navigates
function initMobileDropdowns() {
    document.querySelectorAll('.nav-dropdown > .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (window.innerWidth > BEFREC.mobileBreakpoint) return;

            const dropdown = this.parentElement;

            if (dropdown.classList.contains('dropdown-open')) {
                return; // second click: let the browser follow the href
            }

            e.preventDefault();
            // Close any other open dropdown
            document.querySelectorAll('.nav-dropdown.dropdown-open').forEach(dd => {
                dd.classList.remove('dropdown-open');
            });
            dropdown.classList.add('dropdown-open');
        });
    });

    // Close dropdowns when tapping outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth > BEFREC.mobileBreakpoint) return;
        document.querySelectorAll('.nav-dropdown.dropdown-open').forEach(dd => {
            if (!dd.contains(e.target)) {
                dd.classList.remove('dropdown-open');
            }
        });
    });

    // Clean up dropdown-open classes on resize to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > BEFREC.mobileBreakpoint) {
            document.querySelectorAll('.nav-dropdown.dropdown-open').forEach(dd => {
                dd.classList.remove('dropdown-open');
            });
        }
    });
}

function animateMenuIcon(open) {
    const bars = menuToggleBtn.querySelectorAll('.bar');
    if (bars.length < 3) return;

    if (open) {
        bars[0].style.transform = 'rotate(45deg) translate(4px, 5px)';
        bars[1].style.opacity = '0';
        bars[2].style.transform = 'rotate(-45deg) translate(4px, -5px)';
    } else {
        bars.forEach(bar => {
            bar.style.transform = '';
            bar.style.opacity = '';
        });
    }
}

// ============================================
// SMOOTH SCROLL - Desplazamiento suave
// ============================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();
            const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
            const position = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({ top: position, behavior: 'smooth' });
        });
    });
}

// ============================================
// VALIDACIÓN DE FORMULARIOS
// ============================================

function initFormValidation() {
    document.querySelectorAll('form[data-validate]').forEach(form => {
        form.addEventListener('submit', handleFormSubmit);

        // Validación en tiempo real al salir del campo
        form.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                // Limpiar error mientras escribe
                const formGroup = input.closest('.form-group');
                if (formGroup && formGroup.classList.contains('error') && input.value.trim()) {
                    validateField(input);
                }
            });
        });
    });
}

// URL del backend — ajusta la ruta cuando subas a tu hosting
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost/befrec/backend'
    : '/backend';

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = this;

    if (!validateForm(form)) return;

    const submitBtn  = form.querySelector('button[type="submit"]');
    // .form-success y .form-error-global estan fuera del <form>,
    // buscarlos en el contenedor padre
    const scope     = form.parentElement || document;
    const successMsg = scope.querySelector('.form-success');
    const errorMsg   = scope.querySelector('.form-error-global');
    const originalText = submitBtn.textContent.trim();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    if (errorMsg)   errorMsg.style.display = 'none';
    if (successMsg) successMsg.classList.remove('show');

    try {
        // 1. Obtener token CSRF
        const tokenRes = await fetch(`${BACKEND_URL}/token.php`, { method: 'GET' });
        if (!tokenRes.ok) throw new Error('No se pudo obtener el token de seguridad.');
        const { token: csrfToken } = await tokenRes.json();

        // 2. Recopilar datos del formulario
        const data = {
            csrf_token: csrfToken,
            nombre:     sanitizeInput(form.querySelector('#nombre')?.value   || ''),
            email:      sanitizeInput(form.querySelector('#email')?.value    || ''),
            telefono:   sanitizeInput(form.querySelector('#telefono')?.value || ''),
            servicio:   sanitizeInput(form.querySelector('#servicio')?.value || ''),
            mensaje:    sanitizeInput(form.querySelector('#mensaje')?.value  || ''),
            website:    form.querySelector('#website')?.value || '', // honeypot
        };

        // 3. Enviar al backend
        const res = await fetch(`${BACKEND_URL}/submit-form.php`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(data),
        });

        const result = await res.json();

        if (res.ok && result.ok) {
            // Éxito
            if (successMsg) {
                successMsg.classList.add('show');
                successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Auto-ocultar después de 8 segundos para envíos repetidos
                setTimeout(() => successMsg.classList.remove('show'), 8000);
            }
            form.reset();
            clearFormErrors(form);
            // Re-sincronizar el custom select tras el reset
            form.querySelectorAll('select').forEach(sel => sel.dispatchEvent(new Event('change', { bubbles: true })));
            trackEvent('form_submit', { servicio: data.servicio });
        } else {
            throw new Error(result.error || 'Error al enviar el mensaje.');
        }

    } catch (err) {
        // Mostrar error global al usuario
        if (errorMsg) {
            errorMsg.textContent = err.message || 'Ocurrió un error. Intenta de nuevo o escríbenos por WhatsApp.';
            errorMsg.style.display = 'block';
        }
        console.error('[BEFREC Form Error]', err);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function validateForm(form) {
    let isValid = true;
    clearFormErrors(form);

    form.querySelectorAll('input[required], textarea[required], select[required]').forEach(input => {
        if (!validateField(input)) isValid = false;
    });

    return isValid;
}

function validateField(input) {
    const value = input.value.trim();
    const type = input.type;
    const id = input.id;
    const formGroup = input.closest('.form-group');
    let isValid = true;
    let errorMsg = '';

    // Campo requerido vacío
    if (input.hasAttribute('required') && !value) {
        isValid = false;
        errorMsg = 'Este campo es obligatorio';
    }

    // Validación específica por tipo
    if (isValid && value) {
        if (type === 'email' && !BEFREC.patterns.email.test(value)) {
            isValid = false;
            errorMsg = 'Ingrese un correo electrónico válido';
        }
        else if (type === 'tel' && !BEFREC.patterns.phone.test(value)) {
            isValid = false;
            errorMsg = 'Ingrese un número de teléfono válido';
        }
        else if (id === 'nombre' && !BEFREC.patterns.name.test(value)) {
            isValid = false;
            errorMsg = 'Ingrese un nombre válido';
        }
        else if (input.hasAttribute('minlength')) {
            const min = parseInt(input.getAttribute('minlength'));
            if (value.length < min) {
                isValid = false;
                errorMsg = `Mínimo ${min} caracteres requeridos`;
            }
        }
    }

    // Mostrar/ocultar error
    if (!isValid && formGroup) {
        formGroup.classList.add('error');
        let errorEl = formGroup.querySelector('.form-error');
        if (errorEl) errorEl.textContent = errorMsg;
    } else if (formGroup) {
        formGroup.classList.remove('error');
    }

    return isValid;
}

function clearFormErrors(form) {
    form.querySelectorAll('.form-group.error').forEach(group => {
        group.classList.remove('error');
    });
}

/**
 * Sanitiza input de usuario para prevenir XSS
 * @param {string} text
 * @returns {string}
 */
function sanitizeInput(text) {
    const temp = document.createElement('div');
    temp.textContent = text;
    return temp.innerHTML;
}

// ============================================
// ANIMACIONES DE SCROLL
// ============================================

function initScrollAnimations() {
    // Respetar preferencia de movimiento reducido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
    });

    // Observar elementos animables
    document.querySelectorAll('.servicio-card, .blog-card, .quienes-somos-content').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}

// ============================================
// WHATSAPP - Botón flotante
// ============================================

function initWhatsAppButton() {
    const whatsappBtn = document.querySelector('.whatsapp-float');
    if (!whatsappBtn) return;

    // Detener animación de pulso al hover
    whatsappBtn.addEventListener('mouseenter', () => {
        whatsappBtn.style.animation = 'none';
    });

    whatsappBtn.addEventListener('mouseleave', () => {
        whatsappBtn.style.animation = 'pulse-whatsapp 2s infinite';
    });
}

// ============================================
// COOKIE CONSENT - Banner simple
// ============================================

function showCookieBanner() {
    // No mostrar si ya fue aceptado
    if (localStorage.getItem('cookiesAccepted')) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--gradient-dark);
        color: var(--color-white);
        padding: 1.25rem;
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        flex-wrap: wrap;
        font-size: var(--font-size-sm);
        box-shadow: 0 -4px 24px rgba(0,0,0,0.2);
    `;

    banner.innerHTML = `
        <p style="margin: 0; color: rgba(255,255,255,0.8);">
            Utilizamos cookies propias y de terceros para mejorar tu experiencia.
            Al continuar navegando aceptas nuestra
            <a href="cookies.html" style="color: var(--color-yellow); text-decoration: underline;">Política de Cookies</a>
            y
            <a href="privacidad.html" style="color: var(--color-yellow); text-decoration: underline;">Política de Privacidad</a>.
        </p>
        <button id="accept-cookies" class="btn btn-sm" style="background: var(--gradient-accent); color: var(--color-black); border: none; padding: 0.5rem 1.5rem; border-radius: var(--radius); font-weight: 600; cursor: pointer; font-family: var(--font-heading);">
            Aceptar
        </button>
    `;

    document.body.appendChild(banner);

    document.getElementById('accept-cookies').addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'true');
        banner.remove();
    });
}

// ============================================
// UTILIDADES
// ============================================

function isDev() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

function trackEvent(eventName, data = {}) {
    if (isDev()) {
        console.log(`[Analytics] ${eventName}`, data);
        return;
    }
    // Integrar con Google Analytics u otro servicio aquí
}

// ============================================
// TESTIMONIAL SLIDER - Con efecto infinito
// ============================================

function initTestimonialSlider() {
    const slider = document.getElementById('testimoniosSlider');
    if (!slider) return;
    const track = document.getElementById('testimoniosTrack');
    const cards = Array.from(slider.querySelectorAll('.testimonio-card'));
    const dots = document.querySelectorAll('#testimoniosDots .dot');
    const prevBtn = document.getElementById('prevTestimonio');
    const nextBtn = document.getElementById('nextTestimonio');
    if (cards.length === 0 || !track) return;

    function getVisibleCards() {
        if (window.innerWidth <= 950) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
    }

    function updateClones() {
        const clones = track.querySelectorAll('.testimonio-clone');
        clones.forEach(c => c.remove());
        const visible = getVisibleCards();
        for (let i = 0; i < visible; i++) {
            const clone = cards[i].cloneNode(true);
            clone.classList.add('testimonio-clone');
            track.appendChild(clone);
        }
    }
    updateClones();

    let currentIndex = 0;
    const totalCards = cards.length;

    function getTotalSlides() {
        return Math.ceil(totalCards / getVisibleCards());
    }

    function goToSlide(index, animate) {
        if (animate === undefined) animate = true;
        const visible = getVisibleCards();
        const trackWidth = track.parentElement.offsetWidth;
        const gap = 24;
        const cardWidth = (trackWidth - (visible - 1) * gap) / visible;
        const groupWidth = visible * (cardWidth + gap);
        const totalSlides = getTotalSlides();

        track.style.transition = animate ? 'transform 0.5s ease' : 'none';

        if (index >= totalSlides) {
            track.style.transition = 'transform 0.5s ease';
            track.style.transform = 'translateX(-' + (index * groupWidth) + 'px)';
            currentIndex = 0;
            setTimeout(() => {
                track.style.transition = 'none';
                track.style.transform = 'translateX(0px)';
            }, 500);
        } else {
            currentIndex = ((index % totalSlides) + totalSlides) % totalSlides;
            track.style.transform = 'translateX(-' + (currentIndex * groupWidth) + 'px)';
        }
        dots.forEach(d => d.classList.remove('active'));
        if (dots[currentIndex]) dots[currentIndex].classList.add('active');
    }

    function nextSlide() { goToSlide(currentIndex + 1); }
    function prevSlide() {
        if (currentIndex === 0) {
            goToSlide(getTotalSlides() - 1);
        } else {
            goToSlide(currentIndex - 1);
        }
    }

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));

    let touchStartX = 0;
    slider.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
    slider.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) { if (diff > 0) nextSlide(); else prevSlide(); }
    });

    goToSlide(0, false);
    window.addEventListener('resize', () => { updateClones(); goToSlide(currentIndex, false); });
}

// Exponer funciones globalmente
window.BEFREC = BEFREC;
window.sanitizeInput = sanitizeInput;
window.trackEvent = trackEvent;
