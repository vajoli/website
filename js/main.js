/* ── Live timestamp ── */
function updateTimestamp() {
    const el = document.getElementById('timestamp');
    if (!el) return;
    const now = new Date();
    const mm  = String(now.getMonth() + 1).padStart(2, '0');
    const dd  = String(now.getDate()).padStart(2, '0');
    const yy  = now.getFullYear();
    const hh  = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const tz  = Intl.DateTimeFormat('en', { timeZoneName: 'short' })
                    .formatToParts(now)
                    .find(p => p.type === 'timeZoneName').value;
    el.textContent = `${mm}/${dd}/${yy}  ${hh}:${min} ${tz}`;
}
updateTimestamp();
setInterval(updateTimestamp, 1000);

/* ── Procedural grain texture ── */
(function () {
    const overlay = document.querySelector('.grain-overlay');
    if (!overlay) return;
    const SIZE = 200;
    const canvas = document.createElement('canvas');
    canvas.width  = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(SIZE, SIZE);
    const d   = img.data;
    for (let i = 0; i < d.length; i += 4) {
        const v = Math.floor(Math.random() * 255);
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 18;
    }
    ctx.putImageData(img, 0, 0);
    overlay.style.backgroundImage  = `url(${canvas.toDataURL()})`;
    overlay.style.backgroundRepeat = 'repeat';
}());

/* ── Product page: image switcher ── */
function switchProductImage(src, btn) {
    const main = document.getElementById('main-product-img');
    if (!main) return;
    main.style.opacity = '0';
    setTimeout(() => {
        main.src = src;
        main.style.opacity = '1';
    }, 200);
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
}

/* ── Product page: size selector ── */
function selectSize(btn) {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

/* ── Sticky header shadow ── */
const header = document.querySelector('.site-header');
if (header) {
    window.addEventListener('scroll', () => {
        header.classList.toggle('is-scrolled', window.scrollY > 20);
    }, { passive: true });
}

/* ── Cart ── */
const Cart = {
    key: 'vajoli_cart',
    get()       { return JSON.parse(localStorage.getItem(this.key) || '[]'); },
    save(items) { localStorage.setItem(this.key, JSON.stringify(items)); },

    add(product, size) {
        const items = this.get();
        const hit   = items.find(i => i.id === product.id && i.size === size);
        if (hit) hit.qty++;
        else items.push({ ...product, size, qty: 1 });
        this.save(items);
        this.updateBadge();
    },

    remove(id, size) {
        this.save(this.get().filter(i => !(i.id === id && i.size === size)));
        this.updateBadge();
        renderCart();
    },

    setQty(id, size, qty) {
        if (qty < 1) { this.remove(id, size); return; }
        const items = this.get();
        const hit   = items.find(i => i.id === id && i.size === size);
        if (hit) { hit.qty = qty; this.save(items); }
        this.updateBadge();
        renderCart();
    },

    count() { return this.get().reduce((n, i) => n + i.qty, 0); },
    total() { return this.get().reduce((s, i) => s + i.price * i.qty, 0); },

    updateBadge() {
        const n = this.count();
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = n;
            el.style.display = n ? 'flex' : 'none';
        });
    }
};

Cart.updateBadge();

/* ── Cart toast ── */
function showCartToast(name) {
    const t = document.createElement('div');
    t.className = 'cart-toast';
    t.textContent = name + ' added to cart';
    document.body.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('is-visible')));
    setTimeout(() => {
        t.classList.remove('is-visible');
        t.addEventListener('transitionend', () => t.remove(), { once: true });
    }, 2500);
}

/* ── Cart page render ── */
function renderCart() {
    const list     = document.getElementById('cart-list');
    const subtotal = document.getElementById('cart-subtotal');
    const checkout = document.getElementById('btn-checkout');
    if (!list) return;
    const items = Cart.get();
    if (!items.length) {
        list.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
        if (subtotal) subtotal.textContent = '¥ 0';
        if (checkout) checkout.disabled = true;
        return;
    }
    if (checkout) checkout.disabled = false;
    list.innerHTML = items.map(item => `
        <div class="cart-row">
            <div class="cart-row__img-wrap">
                <img class="cart-row__img" src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-row__info">
                <span class="cart-row__name">${item.name}</span>
                <span class="cart-row__meta">${item.size}</span>
                <span class="cart-row__price-mobile">¥ ${(item.price * item.qty).toLocaleString()}</span>
            </div>
            <div class="cart-row__qty">
                <button class="qty-btn" onclick="Cart.setQty('${item.id}','${item.size}',${item.qty - 1})">−</button>
                <span class="qty-val">${item.qty}</span>
                <button class="qty-btn" onclick="Cart.setQty('${item.id}','${item.size}',${item.qty + 1})">+</button>
            </div>
            <span class="cart-row__price">¥ ${(item.price * item.qty).toLocaleString()}</span>
            <button class="cart-row__remove" onclick="Cart.remove('${item.id}','${item.size}')" aria-label="Remove">×</button>
        </div>
    `).join('');
    if (subtotal) subtotal.textContent = '¥ ' + Cart.total().toLocaleString();
}

/* ── Shopify checkout ── */
const SHOPIFY_DOMAIN = '70uu25-va.myshopify.com';

const SHOPIFY_VARIANTS = {
    boxer: {
        XS: { Black: 48414327275745, Pink: 48414327308513 },
        S:  { Black: 48414327079137, Pink: 48414327111905 },
        M:  { Black: 48414327144673, Pink: 48414327177441 },
        L:  { Black: 48414327210209, Pink: 48414327242977 }
    }
};

function shopifyCheckout() {
    const items = Cart.get();
    if (!items.length) return;

    const variantItems = [];

    items.forEach(function(item) {
        const id   = item.id;
        const size = item.size;
        const qty  = item.qty;

        if (id === 'boxer-pink' || id === 'boxer-black') {
            const color     = id === 'boxer-black' ? 'Black' : 'Pink';
            const variantId = (SHOPIFY_VARIANTS.boxer[size] || {})[color];
            if (variantId) variantItems.push({ id: variantId, qty: qty });

        } else if (id === 'boxer-2pack') {
            const bv = (SHOPIFY_VARIANTS.boxer[size] || {}).Black;
            const pv = (SHOPIFY_VARIANTS.boxer[size] || {}).Pink;
            if (bv) variantItems.push({ id: bv, qty: qty });
            if (pv) variantItems.push({ id: pv, qty: qty });
        }
    });

    if (!variantItems.length) return;

    /* POST directly to Shopify cart — bypasses storefront domain redirect */
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://' + SHOPIFY_DOMAIN + '/cart/add';
    form.style.display = 'none';

    variantItems.forEach(function(v, i) {
        var idEl  = document.createElement('input');
        idEl.name = 'items[' + i + '][id]';
        idEl.value = v.id;
        form.appendChild(idEl);

        var qEl  = document.createElement('input');
        qEl.name = 'items[' + i + '][quantity]';
        qEl.value = v.qty;
        form.appendChild(qEl);
    });

    var ret = document.createElement('input');
    ret.name  = 'return_to';
    ret.value = '/checkout';
    form.appendChild(ret);

    document.body.appendChild(form);
    form.submit();
}

/* Wire checkout button (delegated so it works after SPA swaps) */
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'btn-checkout') shopifyCheckout();
});

/* ── Buy Now button — add to cart then immediately checkout ── */
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-buy-now');
    if (!btn) return;
    const raw = btn.dataset.product;
    if (!raw) return;
    const product = JSON.parse(raw);
    const sizeBtn = document.querySelector('.size-btn.active');
    if (!sizeBtn) {
        const opts = document.querySelector('.size-options');
        if (opts) {
            opts.classList.add('shake');
            opts.addEventListener('animationend', () => opts.classList.remove('shake'), { once: true });
        }
        return;
    }
    Cart.add(product, sizeBtn.textContent.trim());
    shopifyCheckout();
});

/* ── Delegated add-to-cart (survives SPA swaps) ── */
document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-add-cart');
    if (!btn) return;
    const raw = btn.dataset.product;
    if (!raw) return;
    const product  = JSON.parse(raw);
    const sizeBtn  = document.querySelector('.size-btn.active');
    if (!sizeBtn) {
        const opts = document.querySelector('.size-options');
        if (opts) {
            opts.classList.add('shake');
            opts.addEventListener('animationend', () => opts.classList.remove('shake'), { once: true });
        }
        return;
    }
    Cart.add(product, sizeBtn.textContent.trim());
    showCartToast(product.name);
});

/* ── SPA navigation — keeps header + Spotify alive across page changes ── */
(function () {
    if (!document.querySelector('.site-header')) return;

    function isInner(href) {
        try {
            const u = new URL(href, location.href);
            if (u.origin !== location.origin) return false;
            const p = u.pathname;
            if (p === '/' || p === '' || p.endsWith('index.html')) return false;
            return p.endsWith('.html');
        } catch { return false; }
    }

    async function goTo(url) {
        try {
            const html = await fetch(url).then(r => r.text());
            const doc  = new DOMParser().parseFromString(html, 'text/html');

            // Swap only <main>
            const newMain = doc.querySelector('main');
            const oldMain = document.querySelector('main');
            if (newMain && oldMain) oldMain.replaceWith(newMain);

            // Re-execute any <script> tags inside the new <main>
            document.querySelectorAll('main script').forEach(old => {
                const s = document.createElement('script');
                [...old.attributes].forEach(a => s.setAttribute(a.name, a.value));
                s.textContent = old.textContent;
                old.parentNode.replaceChild(s, old);
            });

            // Sync title, active nav link, URL
            document.title = doc.title;
            document.querySelectorAll('.site-nav a').forEach(a => a.classList.remove('active'));
            const ah = doc.querySelector('.site-nav a.active')?.getAttribute('href');
            if (ah) document.querySelector(`.site-nav a[href="${ah}"]`)?.classList.add('active');
            history.pushState({ url }, doc.title, url);

            // Housekeeping
            Cart.updateBadge();
            window.scrollTo(0, 0);
            document.querySelector('.site-header')?.classList.remove('is-scrolled');
            if (document.getElementById('cart-list')) renderCart();

        } catch {
            location.href = url; // fallback: full reload
        }
    }

    document.addEventListener('click', e => {
        const a = e.target.closest('a[href]');
        if (!a || a.target === '_blank') return;
        const href = a.getAttribute('href');
        if (href && isInner(href)) { e.preventDefault(); goTo(href); }
    });

    window.addEventListener('popstate', e => { if (e.state?.url) goTo(e.state.url); });
}());

/* ── Auto-render cart on direct load ── */
if (document.getElementById('cart-list')) renderCart();

/* ── Boxer: color + gallery switcher ── */
function selectBoxerColor(btn) {
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const front = btn.dataset.front;
    const back  = btn.dataset.back;
    const color = btn.dataset.color;

    // Update main image to front of new color
    const main = document.getElementById('main-product-img');
    if (main) {
        main.style.opacity = '0';
        setTimeout(() => { main.src = front; main.style.opacity = '1'; }, 200);
    }

    // Update thumbnails
    const thumbs = document.querySelectorAll('.product-gallery__thumbs .thumb');
    if (thumbs[0]) {
        thumbs[0].querySelector('img').src = front;
        thumbs[0].setAttribute('onclick', `switchProductImage('${front}', this)`);
        thumbs[0].classList.add('active');
    }
    if (thumbs[1]) {
        thumbs[1].querySelector('img').src = back;
        thumbs[1].setAttribute('onclick', `switchProductImage('${back}', this)`);
        thumbs[1].classList.remove('active');
    }

    // Update add-to-cart data with correct color/image
    const addBtn = document.querySelector('.btn-add-cart');
    if (addBtn) {
        const p = JSON.parse(addBtn.dataset.product);
        p.id    = 'boxer-' + color.toLowerCase();
        p.name  = 'Boxer Shorts — ' + color;
        p.image = front;
        addBtn.dataset.product = JSON.stringify(p);
    }
}

/* ── Spotify mini player (inner pages) ── */
const _playIcon  = `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg>`;
const _pauseIcon = `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"/></svg>`;

function playerPlayPause() { if (window._spotifyCtrl) window._spotifyCtrl.togglePlay(); }
function playerNext()      { if (window._spotifyCtrl) window._spotifyCtrl.nextTrack(); }
function playerPrev()      { if (window._spotifyCtrl) window._spotifyCtrl.previousTrack(); }

(function () {
    if (!document.getElementById('spotify-mini')) return;

    window.onSpotifyIframeApiReady = function (IFrameAPI) {
        const mini = document.getElementById('spotify-mini');
        IFrameAPI.createController(mini, {
            uri: 'spotify:playlist:5VkpHDVp1KGWpnn2luR92s',
            width: '100%',
            height: '80'
        }, function (ctrl) {
            window._spotifyCtrl = ctrl;
            ctrl.addListener('playback_update', function (e) {
                const btn = document.getElementById('player-playpause');
                if (!btn) return;
                btn.innerHTML = e.data.isPaused ? _playIcon : _pauseIcon;
            });
        });
    };

    const s = document.createElement('script');
    s.src = 'https://open.spotify.com/embed/iframe-api/v1';
    s.async = true;
    document.head.appendChild(s);
}());
