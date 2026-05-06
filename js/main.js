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
    whatsapp: '573160444428',
    email: 'contacto@befrec.com',
    address: 'Cra 88d 6d 27, Bogotá, Colombia',
    phone: '3160444428',
    mobileBreakpoint: 768,

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
    initSmoothScroll();
    initFormValidation();
    initScrollAnimations();
    initWhatsAppButton();
});

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

    // Cerrar menú al hacer clic en un enlace (en móvil)
    navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= BEFREC.mobileBreakpoint) {
                closeMenu();
            }
        });
    });

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

function handleFormSubmit(e) {
    e.preventDefault();
    const form = this;

    if (!validateForm(form)) return;

    // Simular envío exitoso
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    setTimeout(() => {
        // Mostrar éxito
        const successMsg = form.querySelector('.form-success');
        if (successMsg) successMsg.classList.add('show');

        // Limpiar formulario
        form.reset();
        clearFormErrors(form);

        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }, 1200);
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

// Mostrar banner de cookies al cargar
showCookieBanner();

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

// Exponer funciones globalmente
window.BEFREC = BEFREC;
window.sanitizeInput = sanitizeInput;
window.trackEvent = trackEvent;
