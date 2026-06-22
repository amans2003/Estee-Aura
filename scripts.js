'use strict';

// ─── Base path (works at root or in a sub-folder) ─────────────────────────────
const _BASE = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  cart: JSON.parse(localStorage.getItem('estee_cart') || '[]'),
  activeCategory: 'All',
  searchQuery: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function navigate(page, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const path = page === 'home'
    ? _BASE + '/'
    : _BASE + '/' + page + (qs ? '?' + qs : '');
  history.pushState({ page, params }, '', path);
  route();
}

function fmtPrice(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="${i <= Math.round(rating) ? 'text-amber-400' : 'text-stone-300'}" aria-hidden="true">★</span>`;
  }
  return html;
}

function badgeHTML(badge) {
  if (!badge) return '';
  const map = {
    'Best Seller': 'bg-amber-500 text-white',
    'Top Rated':   'bg-emerald-600 text-white',
    'New Arrival': 'bg-sky-500 text-white',
    'Popular':     'bg-violet-500 text-white',
    'Luxury':      'bg-stone-800 text-amber-300',
  };
  return `<span class="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${map[badge] || 'bg-stone-500 text-white'}">${badge}</span>`;
}

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
function cartCount() {
  return state.cart.reduce((s, i) => s + i.qty, 0);
}

function addToCart(id) {
  const p = PRODUCTS.find(x => x.id === +id);
  if (!p) return;
  const item = state.cart.find(x => x.id === p.id);
  if (item) item.qty++; else state.cart.push({ id: p.id, qty: 1 });
  localStorage.setItem('estee_cart', JSON.stringify(state.cart));
  updateCartBadge();
  showToast(`${p.name} added to cart!`);
}

function updateCartBadge() {
  const n = cartCount();
  document.querySelectorAll('[data-cart-count]').forEach(el => {
    el.textContent = n;
    el.classList.toggle('hidden', n === 0);
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('translate-y-20', 'opacity-0');
  t.classList.add('translate-y-0', 'opacity-100');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => {
    t.classList.add('translate-y-20', 'opacity-0');
    t.classList.remove('translate-y-0', 'opacity-100');
  }, 2800);
}

function whatsappBuy(name) {
  const msg = encodeURIComponent(`Hi Estée Aura! I want to buy: ${name}`);
  window.open(`https://wa.me/919999999999?text=${msg}`, '_blank', 'noopener,noreferrer');
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function productCard(p) {
  const disc = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  return `
  <article class="product-card group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl
                  transition-all duration-300 hover:-translate-y-1 border border-stone-100 cursor-pointer"
           onclick="navigate('product',{id:${p.id}})"
           role="button" tabindex="0" aria-label="View details for ${p.name}"
           onkeydown="if(event.key==='Enter'||event.key===' '){navigate('product',{id:${p.id}})}">
    <div class="relative overflow-hidden h-48">
      ${badgeHTML(p.badge)}
      ${disc ? `<span class="absolute top-3 right-3 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold">${disc}% off</span>` : ''}
      <img src="${p.img}" alt="${p.name}" loading="lazy"
           class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
           onerror="this.src='https://picsum.photos/seed/${p.id}/400/300'">
    </div>
    <div class="p-4">
      <p class="text-xs text-herb font-semibold uppercase tracking-widest mb-1">${p.category}</p>
      <h3 class="font-serif text-[15px] font-semibold text-earth leading-snug mb-1 line-clamp-2">${p.name}</h3>
      <p class="text-xs text-stone-400 mb-3 line-clamp-2">${p.shortDesc}</p>
      <div class="flex items-center gap-1 mb-3" aria-label="${p.stars} stars, ${p.reviews} reviews">
        <span class="text-sm leading-none">${renderStars(p.stars)}</span>
        <span class="text-xs text-stone-400">(${p.reviews})</span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <div class="leading-tight">
          <span class="text-base font-bold text-earth">${fmtPrice(p.price)}</span>
          ${p.mrp > p.price ? `<span class="text-xs text-stone-400 line-through ml-1">${fmtPrice(p.mrp)}</span>` : ''}
        </div>
        <button onclick="event.stopPropagation();whatsappBuy('${p.name.replace(/'/g, "\\'")}')"
                class="flex items-center gap-1 text-xs bg-green-500 text-white px-3 py-1.5 rounded-full hover:bg-green-600 transition-colors whitespace-nowrap shadow-sm"
                aria-label="Buy ${p.name} via WhatsApp">
          <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.18-.008-.38-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 0C5.373 0 0 5.373 0 12c0 2.117.547 4.103 1.504 5.832L0 24l6.335-1.462A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0"/></svg>
          Buy
        </button>
      </div>
    </div>
  </article>`;
}

// ─── Intersection animation ───────────────────────────────────────────────────
function animateIn(root) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  root.querySelectorAll('.fade-up').forEach(el => io.observe(el));
}

// ─── Hero slider ──────────────────────────────────────────────────────────────
let _heroTimer = null;

function initHeroSlider() {
  if (_heroTimer) clearInterval(_heroTimer);
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.hero-dot');
  if (slides.length < 2) return;
  let cur = 0;

  function goTo(next) {
    slides[cur].style.opacity = '0';
    dots[cur].style.opacity  = '0.35';
    dots[cur].style.width    = '8px';
    cur = next % slides.length;
    slides[cur].style.opacity = '1';
    dots[cur].style.opacity   = '1';
    dots[cur].style.width     = '28px';
  }

  _heroTimer = setInterval(() => goTo(cur + 1), 3000);
}

// ─── Countdown timer ──────────────────────────────────────────────────────────
function initCountdown() {
  const target = new Date();
  target.setDate(target.getDate() + 3);
  target.setHours(23, 59, 59, 0);

  function tick() {
    const diff = target - new Date();
    if (diff <= 0) return;
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);
    const vals  = [days, hours, mins, secs];
    document.querySelectorAll('.countdown-val').forEach(el => {
      const u = +el.dataset.unit;
      if (u < vals.length) el.textContent = String(vals[u]).padStart(2, '0');
    });
  }
  tick();
  if (window._countdownTimer) clearInterval(window._countdownTimer);
  window._countdownTimer = setInterval(tick, 1000);
}

// ─── Page: Home ───────────────────────────────────────────────────────────────
function renderHome(el) {
  const heroImgs = [
    'https://images.pexels.com/photos/4589169/pexels-photo-4589169.jpeg?auto=compress&cs=tinysrgb&w=1400',
    'https://images.pexels.com/photos/7829483/pexels-photo-7829483.jpeg?auto=compress&cs=tinysrgb&w=1400',
    'https://images.pexels.com/photos/4871315/pexels-photo-4871315.jpeg?auto=compress&cs=tinysrgb&w=1400',
  ];

  // ── Hero ──
  const heroSlot = document.getElementById('hero-slot');
  if (heroSlot) {
    heroSlot.innerHTML = `
<section class="relative w-full overflow-hidden"
         style="height:calc(100vh - 108px);min-height:520px;max-height:860px"
         aria-label="Hero slideshow">
  ${heroImgs.map((src, i) => `
  <div class="hero-slide absolute inset-0 bg-cover bg-center bg-no-repeat"
       style="background-image:url('${src}');opacity:${i===0?1:0};transition:opacity 1.2s ease-in-out"
       role="img" aria-hidden="${i!==0}"></div>`).join('')}
  <div class="absolute inset-0 bg-black/55"></div>
  <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45"></div>
  <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-5 sm:px-10">
    <p class="text-gold text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em] mb-3 sm:mb-4">
      Since 2018 &nbsp;·&nbsp; Certified Organic
    </p>
    <h1 class="font-sans font-extrabold text-white leading-tight mb-4 sm:mb-5"
        style="font-size:clamp(2rem,6vw,4.5rem)">
      Ancient Wisdom,<br>
      <span style="color:#D4AC0D">Modern Wellness</span>
    </h1>
    <p class="text-white/80 leading-relaxed mb-7 sm:mb-9"
       style="font-size:clamp(0.9rem,2vw,1.1rem);max-width:540px">
      Discover the healing power of authentic Ayurveda — crafted from the finest organic herbs, following formulations passed down through generations.
    </p>
    <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0">
      <button onclick="navigate('products')"
              class="bg-herb text-white font-bold px-9 py-3.5 rounded-full hover:bg-forest transition-colors shadow-lg text-sm sm:text-base">
        Shop Now
      </button>
      <button onclick="navigate('about')"
              class="border-2 border-white/60 text-white font-semibold px-9 py-3.5 rounded-full hover:bg-white/15 transition-colors text-sm sm:text-base">
        Our Story
      </button>
    </div>
  </div>
  <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
    ${heroImgs.map((_, i) => `
    <div class="hero-dot rounded-full bg-white"
         style="height:5px;width:${i===0?'28px':'8px'};opacity:${i===0?1:0.35};transition:all 0.45s ease"></div>`).join('')}
  </div>
</section>`;
  }

  // ── Category data ──
  const CATS = [
    { name: 'Face Creams', count: 3, img: 'Product-4.jpeg' },
    { name: 'Face Masks',  count: 2, img: 'Product-2.jpeg' },
    { name: 'Serums',      count: 4, img: 'Product-3.jpeg' },
    { name: 'Cleansers',   count: 3, img: 'Product-3.jpeg' },
    { name: 'Face Oils',   count: 5, img: 'https://images.pexels.com/photos/4589169/pexels-photo-4589169.jpeg?auto=compress&cs=tinysrgb&w=300' },
    { name: 'Gift Kits',   count: 2, img: 'https://images.pexels.com/photos/4871315/pexels-photo-4871315.jpeg?auto=compress&cs=tinysrgb&w=300' },
  ];

  // ── Features data ──
  const FEATS = [
    { icon: '🌿', t: 'Direct From Source',    d: 'Herbs sourced directly from certified organic farms across India.' },
    { icon: '📜', t: 'Ayurvedic Formula',      d: 'Formulations rooted in ancient texts, perfected over centuries.' },
    { icon: '🔬', t: 'Lab Tested',             d: 'Every batch independently verified for purity, potency, and safety.' },
    { icon: '🌱', t: 'Natural Ingredients',    d: 'No harsh chemicals, parabens, sulfates, or synthetic additives.' },
    { icon: '🕊️', t: 'Cruelty Free',           d: 'Never tested on animals. Our ethics match our ingredients.' },
  ];

  // ── Testimonials data ──
  const TESTI = [
    { name: 'Priya Sharma',  loc: 'Mumbai',    text: 'The Kumkumadi Face Mask has transformed my skin completely! Natural, effective, and smells divine. Nothing compares to Estée Aura.' },
    { name: 'Arjun Mehta',   loc: 'Delhi',     text: 'My wife loves the Lumi Correct Cream. Three weeks in and her skin is visibly brighter. We are now loyal customers for life!' },
    { name: 'Neha Reddy',    loc: 'Bengaluru', text: 'Finally found skincare without harsh chemicals. The True-Glow Serum is incredible. My skin has never looked this good at 35.' },
  ];

  // ── Blog posts data ──
  const BLOGS = [
    { img: 'https://images.pexels.com/photos/4589169/pexels-photo-4589169.jpeg?auto=compress&cs=tinysrgb&w=600', cat: 'Skincare',  date: 'June 15, 2025', title: 'The Ancient Secret of Kumkumadi — Benefits for Modern Skin', excerpt: 'Kumkumadi is one of the most prized Ayurvedic formulations. Discover how this centuries-old recipe can transform your complexion.' },
    { img: 'https://images.pexels.com/photos/7829483/pexels-photo-7829483.jpeg?auto=compress&cs=tinysrgb&w=600', cat: 'Wellness', date: 'June 8, 2025',  title: 'Build Your Ayurvedic Skincare Routine in 5 Simple Steps',          excerpt: 'A holistic routine based on your Ayurvedic dosha type. Learn how to choose products that truly complement your skin\'s nature.' },
    { img: 'https://images.pexels.com/photos/4871315/pexels-photo-4871315.jpeg?auto=compress&cs=tinysrgb&w=600', cat: 'Education', date: 'May 28, 2025', title: 'Why Natural Ingredients Always Beat Chemical Formulas',             excerpt: 'Modern research is finally catching up with what Ayurveda has known for 5000 years. Here\'s the science behind natural skincare.' },
  ];

  // ── Instagram images ──
  const IG = [
    'https://images.pexels.com/photos/4589169/pexels-photo-4589169.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/7829483/pexels-photo-7829483.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/4871315/pexels-photo-4871315.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Product-4.jpeg',
    'Product-2.jpeg',
    'Product-3.jpeg',
  ];

  el.innerHTML = `

  <!-- ══ SECTION 1: Category Browser ══ -->
  <section class="py-14 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
      <div class="text-center mb-10">
        <p class="text-herb text-xs font-bold uppercase tracking-widest mb-2">Browse by Category</p>
        <h2 class="text-3xl font-extrabold text-earth">Shop Our Collections</h2>
      </div>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-6 sm:gap-8">
        ${CATS.map(c => `
        <button onclick="navigate('products')"
                class="group flex flex-col items-center gap-3">
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 flex-shrink-0">
            <img src="${c.img}" alt="${c.name}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
          </div>
          <div class="text-center">
            <p class="font-bold text-earth text-xs sm:text-sm leading-tight">${c.name}</p>
            <p class="text-herb text-[10px] sm:text-xs mt-0.5">${c.count} Products</p>
          </div>
        </button>`).join('')}
      </div>
    </div>
  </section>

  <!-- ══ SECTION 2: Welcome / About ══ -->
  <section class="py-16 sm:py-20" style="background:#f7faf0">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
      <div class="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div class="fade-up">
          <p class="text-herb text-xs font-bold uppercase tracking-widest mb-3">Welcome to Estée Aura</p>
          <h2 class="text-3xl sm:text-4xl font-extrabold text-earth leading-tight mb-5">
            Authentic Ayurveda<br>for <span class="text-herb">Modern Skin</span>
          </h2>
          <ul class="space-y-3 mb-6">
            ${['100% Natural, Plant-Based Ingredients','Ancient Ayurvedic Formulations','Dermatologically Tested & Safe'].map(pt => `
            <li class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-herb flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</span>
              <span class="text-stone-600 text-sm">${pt}</span>
            </li>`).join('')}
          </ul>
          <p class="text-stone-500 text-sm leading-relaxed mb-6">
            Estée Aura was born from a deep belief in the healing power of nature. Every product we craft draws from centuries-old Ayurvedic wisdom, using only the finest organic herbs and botanicals, formulated for modern skin concerns.
          </p>
          <div class="flex items-center gap-5 flex-wrap">
            <button onclick="navigate('about')"
                    class="bg-herb text-white font-semibold px-7 py-3 rounded-full hover:bg-forest transition-colors text-sm shadow-md">
              Discover Our Story
            </button>
            <div class="flex items-center gap-2">
              <span class="text-amber-400 text-sm">★★★★★</span>
              <span class="text-stone-400 text-xs">Rated 4.9/5 by 500+ customers</span>
            </div>
          </div>
        </div>
        <div class="relative fade-up">
          <div class="rounded-3xl overflow-hidden shadow-2xl">
            <img src="Product-3.jpeg" alt="Estée Aura Products" loading="lazy"
                 class="w-full h-80 sm:h-96 object-cover">
          </div>
          <div class="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl border border-stone-100">
            <p class="text-2xl font-extrabold text-herb">500+</p>
            <p class="text-xs text-stone-500 font-medium">Happy Customers</p>
          </div>
          <div class="absolute -top-4 -right-4 bg-earth text-white rounded-2xl p-4 shadow-xl">
            <p class="text-2xl font-extrabold text-gold">100%</p>
            <p class="text-xs text-white/65">Natural & Safe</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ══ SECTION 3: Trending Products ══ -->
  <section class="py-16 sm:py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
      <div class="flex items-end justify-between mb-10">
        <div class="fade-up">
          <p class="text-herb text-xs font-bold uppercase tracking-widest mb-2">Our Collection</p>
          <h2 class="text-3xl font-extrabold text-earth">Trending Products</h2>
        </div>
        <button onclick="navigate('products')" class="text-herb text-sm font-semibold hover:text-forest transition-colors flex items-center gap-1 fade-up">
          View All <span aria-hidden="true">→</span>
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 fade-up">
        ${PRODUCTS.map(productCard).join('')}
      </div>
    </div>
  </section>

  <!-- ══ SECTION 4: Features + Banners ══ -->
  <section class="py-16 sm:py-20" style="background:#f0f5e8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
      <div class="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
        <div class="fade-up">
          <p class="text-herb text-xs font-bold uppercase tracking-widest mb-2">Why Choose Us</p>
          <h2 class="text-3xl font-extrabold text-earth mb-8">The Estée Aura Difference</h2>
          <div class="space-y-4">
            ${FEATS.map(f => `
            <div class="flex items-start gap-4 p-4 bg-white rounded-2xl border border-stone-100 hover:shadow-md transition-shadow">
              <div class="w-12 h-12 bg-herb/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">${f.icon}</div>
              <div>
                <h3 class="font-bold text-earth text-sm mb-1">${f.t}</h3>
                <p class="text-stone-500 text-xs leading-relaxed">${f.d}</p>
              </div>
            </div>`).join('')}
          </div>
        </div>
        <div class="flex flex-col gap-4 fade-up">
          <div class="relative rounded-2xl overflow-hidden h-52 group cursor-pointer" onclick="navigate('products')">
            <img src="Product-2.jpeg" alt="Face Masks Collection" loading="lazy"
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
            <div class="absolute inset-0 flex flex-col justify-center px-8">
              <p class="text-gold text-[10px] font-bold uppercase tracking-widest mb-1">Collection</p>
              <h3 class="text-white text-2xl font-extrabold mb-3">Face Masks</h3>
              <button class="self-start text-xs border border-white text-white px-5 py-2 rounded-full hover:bg-white hover:text-earth transition-colors font-semibold">
                Shop Now
              </button>
            </div>
          </div>
          <div class="relative rounded-2xl overflow-hidden h-52 group cursor-pointer" onclick="navigate('products')">
            <img src="Product-3.jpeg" alt="Serums and Oils" loading="lazy"
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
            <div class="absolute inset-0 flex flex-col justify-center px-8">
              <p class="text-gold text-[10px] font-bold uppercase tracking-widest mb-1">Featured</p>
              <h3 class="text-white text-2xl font-extrabold mb-3">Serums & Oils</h3>
              <button class="self-start text-xs border border-white text-white px-5 py-2 rounded-full hover:bg-white hover:text-earth transition-colors font-semibold">
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ══ SECTION 5: Certifications ══ -->
  <section class="py-12 bg-white border-t border-b border-stone-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
      <div class="text-center mb-8 fade-up">
        <p class="text-herb text-xs font-bold uppercase tracking-widest mb-2">Quality Assurance</p>
        <h2 class="text-2xl font-extrabold text-earth">Trusted & Certified</h2>
      </div>
      <div class="flex flex-wrap justify-center gap-3 fade-up">
        ${[
          { icon:'🌾', name:'USDA Organic' },
          { icon:'🏭', name:'GMP Certified' },
          { icon:'🕊️', name:'Cruelty Free' },
          { icon:'🔬', name:'Dermatologically Tested' },
          { icon:'🌱', name:'100% Natural' },
        ].map(c => `
        <div class="flex flex-col items-center gap-1.5 bg-cream rounded-xl px-4 py-3 border border-herb/15 hover:border-herb/40 transition-colors w-28">
          <span class="text-2xl">${c.icon}</span>
          <p class="text-earth font-semibold text-[11px] text-center leading-tight">${c.name}</p>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ══ SECTION 6: Top Selling + Countdown ══ -->
  <section class="py-16 sm:py-20" style="background:#f7faf0">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
      <div class="text-center mb-10 fade-up">
        <p class="text-herb text-xs font-bold uppercase tracking-widest mb-2">Flash Sale</p>
        <h2 class="text-3xl font-extrabold text-earth">Limited Time Offers</h2>
      </div>
      <div class="grid md:grid-cols-2 gap-6 fade-up">
        ${[
          { id:1, name:'Lumi Correct Cream',   price:699, mrp:899, img:'Product-4.jpeg', disc:22 },
          { id:2, name:'Kumkumadi Face Mask',   price:549, mrp:699, img:'Product-2.jpeg', disc:21 },
        ].map(p => `
        <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 flex flex-col sm:flex-row group hover:shadow-xl transition-shadow">
          <div class="sm:w-52 h-52 sm:h-auto overflow-hidden flex-shrink-0 cursor-pointer" onclick="navigate('product',{id:${p.id}})">
            <img src="${p.img}" alt="${p.name}" loading="lazy"
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          </div>
          <div class="flex-1 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs bg-red-100 text-red-600 px-2.5 py-0.5 rounded-full font-bold">${p.disc}% OFF</span>
                <span class="text-amber-400 text-sm">★★★★★</span>
              </div>
              <h3 class="font-extrabold text-earth text-lg mb-2 mt-2">${p.name}</h3>
              <div class="flex items-baseline gap-2 mb-4">
                <span class="text-2xl font-extrabold text-herb">${fmtPrice(p.price)}</span>
                <span class="text-sm text-stone-400 line-through">${fmtPrice(p.mrp)}</span>
              </div>
              <p class="text-stone-400 text-xs mb-3 font-medium uppercase tracking-wide">Offer Ends In:</p>
              <div class="flex gap-2 mb-5">
                ${['DD','HH','MM','SS'].map((unit,i) => `
                <div class="flex-1 text-center bg-earth rounded-xl py-2.5 px-1">
                  <div class="countdown-val text-white font-extrabold text-xl leading-none" data-unit="${i}">00</div>
                  <div class="text-white/45 text-[9px] mt-1 tracking-wider">${unit}</div>
                </div>`).join('')}
              </div>
            </div>
            <button onclick="whatsappBuy('${p.name.replace(/'/g,"\\'")}')"
                    class="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-full hover:bg-green-600 transition-colors text-sm shadow-sm">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.18-.008-.38-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 0C5.373 0 0 5.373 0 12c0 2.117.547 4.103 1.504 5.832L0 24l6.335-1.462A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0"/></svg>
              Buy via WhatsApp
            </button>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ══ SECTION 7: Benefits Strip ══ -->
  <section class="py-12" style="background:#1a2600">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        ${[
          { icon:'🚚', t:'Free Shipping',   s:'On orders above ₹999' },
          { icon:'💬', t:'24/7 Support',    s:'Always here for you' },
          { icon:'🔒', t:'Secure Payment',  s:'100% safe checkout' },
          { icon:'🔄', t:'Easy Returns',    s:'7-day return policy' },
        ].map(b => `
        <div class="flex flex-col items-center gap-3 p-4 text-center">
          <div class="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style="background:rgba(77,124,15,0.3)">${b.icon}</div>
          <div>
            <p class="text-white font-bold text-sm">${b.t}</p>
            <p class="text-white/45 text-xs mt-0.5">${b.s}</p>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ══ SECTION 8: Testimonials ══ -->
  <section class="py-16 sm:py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
      <div class="text-center mb-10 fade-up">
        <p class="text-herb text-xs font-bold uppercase tracking-widest mb-2">Customer Reviews</p>
        <h2 class="text-3xl font-extrabold text-earth">What Our Customers Say</h2>
      </div>
      <div class="grid md:grid-cols-3 gap-6 fade-up">
        ${TESTI.map(t => `
        <div class="relative bg-cream rounded-3xl p-6 border border-herb/10 hover:shadow-lg transition-shadow">
          <div class="text-amber-400 text-sm mb-3">★★★★★</div>
          <p class="text-stone-600 text-sm leading-relaxed mb-5 italic">"${t.text}"</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-herb flex items-center justify-center text-white font-bold text-sm flex-shrink-0">${t.name[0]}</div>
            <div>
              <p class="font-bold text-earth text-sm">${t.name}</p>
              <p class="text-stone-400 text-xs">${t.loc}</p>
            </div>
          </div>
          <div class="absolute top-5 right-6 text-herb/15 font-serif leading-none select-none" style="font-size:5rem;line-height:1">"</div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ══ SECTION 9: Blog ══ -->
  <section class="py-16 sm:py-20" style="background:#f7faf0">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
      <div class="flex items-end justify-between mb-10">
        <div class="fade-up">
          <p class="text-herb text-xs font-bold uppercase tracking-widest mb-2">From Our Blog</p>
          <h2 class="text-3xl font-extrabold text-earth">Ayurvedic Insights</h2>
        </div>
        <button class="text-herb text-sm font-semibold hover:text-forest transition-colors fade-up">View All →</button>
      </div>
      <div class="grid md:grid-cols-3 gap-6 fade-up">
        ${BLOGS.map(b => `
        <article class="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 group cursor-pointer hover:shadow-lg transition-shadow">
          <div class="relative h-48 overflow-hidden">
            <img src="${b.img}" alt="${b.title}" loading="lazy"
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute top-4 left-4 bg-herb text-white text-xs px-3 py-1 rounded-full font-semibold">${b.cat}</div>
          </div>
          <div class="p-5">
            <div class="flex items-center gap-2 text-stone-400 text-xs mb-3">
              <span>${b.date}</span>
              <span>·</span>
              <span>5 min read</span>
            </div>
            <h3 class="font-extrabold text-earth text-base mb-2 leading-snug line-clamp-2 group-hover:text-herb transition-colors">${b.title}</h3>
            <p class="text-stone-500 text-xs leading-relaxed line-clamp-2">${b.excerpt}</p>
            <div class="mt-4 flex items-center text-herb text-xs font-semibold gap-1">Read More <span>→</span></div>
          </div>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <!-- ══ SECTION 10: Instagram Grid ══ -->
  <section class="py-16 sm:py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
      <div class="text-center mb-10 fade-up">
        <p class="text-herb text-xs font-bold uppercase tracking-widest mb-2">Follow Us</p>
        <h2 class="text-3xl font-extrabold text-earth">@esteeaura on Instagram</h2>
      </div>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 fade-up">
        ${IG.map(img => `
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
           class="relative overflow-hidden rounded-xl sm:rounded-2xl group block" style="aspect-ratio:1">
          <img src="${img}" alt="Estée Aura on Instagram" loading="lazy"
               class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
          <div class="absolute inset-0 flex items-center justify-center transition-colors" style="background:rgba(0,0,0,0)">
            <div class="opacity-0 group-hover:opacity-100 transition-opacity" style="color:white">
              <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="5"/>
                <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none"/>
              </svg>
            </div>
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors -z-0 rounded-xl sm:rounded-2xl"></div>
          </div>
        </a>`).join('')}
      </div>
      <div class="text-center mt-8 fade-up">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
           class="inline-flex items-center gap-2 text-white font-semibold px-8 py-3 rounded-full text-sm shadow-md hover:opacity-90 transition-opacity"
           style="background:linear-gradient(135deg,#6366f1,#ec4899,#f97316)">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" rx="5"/>
            <circle cx="12" cy="12" r="5"/>
            <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none"/>
          </svg>
          Follow on Instagram
        </a>
      </div>
    </div>
  </section>`;

  requestAnimationFrame(() => { animateIn(el); initHeroSlider(); initCountdown(); });
}

// ─── Page: About ──────────────────────────────────────────────────────────────
function renderAbout(el) {
  el.innerHTML = `
  <div class="fade-up relative h-64 md:h-80 rounded-3xl overflow-hidden mb-12">
    <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80"
         alt="Fresh Ayurvedic herbs and botanicals" class="w-full h-full object-cover">
    <div class="absolute inset-0 bg-forest/70 flex items-center justify-center text-center px-4">
      <div>
        <p class="text-gold text-sm font-semibold uppercase tracking-widest mb-3">Est. 2018</p>
        <h1 class="font-serif text-4xl md:text-5xl font-bold text-white">About Estée Aura</h1>
      </div>
    </div>
  </div>

  <section class="fade-up grid md:grid-cols-2 gap-12 items-center mb-16">
    <div>
      <h2 class="font-serif text-3xl font-bold text-earth mb-4">From a Village Vaidya's Notes to Your Doorstep</h2>
      <p class="text-stone-600 leading-relaxed mb-4">
        Estée Aura began in 2018 when our founder, having watched her grandmother heal the entire family with kitchen herbs and traditional formulations, decided the world deserved access to that same quality — without compromise.
      </p>
      <p class="text-stone-600 leading-relaxed mb-4">
        What started as a small batch of homemade Chyawanprash shared with friends in Delhi has grown into a trusted wellness brand serving over 40,000 households across India. Our core philosophy remains unchanged: <em>authentic formulations, traceable ingredients, zero shortcuts</em>.
      </p>
      <p class="text-stone-600 leading-relaxed">
        We work directly with over 30 certified organic farms, employ a team of in-house Ayurvedic practitioners, and subject every batch to rigorous third-party testing.
      </p>
    </div>
    <div class="space-y-4">
      <img src="https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=600&q=80"
           alt="Ayurvedic herb preparation process" class="rounded-2xl shadow-lg w-full h-52 object-cover">
      <div class="grid grid-cols-3 gap-4">
        ${[{n:'40K+',l:'Customers'},{n:'30+',l:'Partner Farms'},{n:'8+',l:'Years Trust'}].map(s=>`
        <div class="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
          <p class="font-serif text-2xl font-bold text-earth">${s.n}</p>
          <p class="text-xs text-stone-500">${s.l}</p>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="fade-up mb-16 bg-[#FFFDF5] rounded-3xl p-8 md:p-12 border border-stone-100">
    <div class="text-center mb-10">
      <p class="text-herb text-sm font-semibold uppercase tracking-widest mb-1">What We Stand For</p>
      <h2 class="font-serif text-3xl font-bold text-earth">Our Core Values</h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      ${[
        { icon: '🌿', t: 'Purity Above All', d: 'We use only the ingredients on the label. No fillers, no hidden additives, no misleading claims.' },
        { icon: '📜', t: 'Rooted in Shastra', d: 'Formulations grounded in Charaka Samhita, Sushruta, and Ashtanga Hridayam — classical Ayurvedic texts.' },
        { icon: '🤝', t: 'Farmer Partnerships', d: 'Fair prices, long-term contracts, and shared sustainability practices with every partner farm.' },
        { icon: '🔬', t: 'Scientific Validation', d: 'We track emerging research and validate traditional claims through modern evidence wherever possible.' },
        { icon: '♻️', t: 'Sustainable Packaging', d: 'All packaging is recyclable or compostable. Committed to zero plastic by 2027.' },
        { icon: '💚', t: 'Community First', d: '5% of profits support rural Ayurvedic practitioners and organic farming education programmes.' },
      ].map(v=>`
      <div class="flex gap-4 p-4 bg-white rounded-2xl border border-stone-100 hover:shadow-md transition-shadow">
        <span class="text-3xl flex-shrink-0 mt-0.5" aria-hidden="true">${v.icon}</span>
        <div>
          <h3 class="font-semibold text-earth mb-1 text-sm">${v.t}</h3>
          <p class="text-stone-500 text-xs leading-relaxed">${v.d}</p>
        </div>
      </div>`).join('')}
    </div>
  </section>

  <section class="fade-up mb-16">
    <div class="text-center mb-10">
      <p class="text-herb text-sm font-semibold uppercase tracking-widest mb-1">The People</p>
      <h2 class="font-serif text-3xl font-bold text-earth">Guided by Expertise</h2>
    </div>
    <div class="grid sm:grid-cols-3 gap-8">
      ${[
        { name: 'Dr. Lakshmi Nair', role: 'Chief Ayurvedic Physician', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80', bio: 'BAMS, MD Ayurveda · 18 years clinical experience' },
        { name: 'Rohan Sharma', role: 'Founder & CEO', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80', bio: 'Passionate advocate for accessible Ayurveda' },
        { name: 'Sunita Mehta', role: 'Head of Quality', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&q=80', bio: 'MSc Pharmacognosy · 12 years herbal QA' },
      ].map(m=>`
      <div class="text-center group">
        <div class="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 shadow-lg ring-4 ring-amber-100">
          <img src="${m.img}" alt="Photo of ${m.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
        </div>
        <h3 class="font-serif font-semibold text-earth text-lg">${m.name}</h3>
        <p class="text-herb text-sm font-medium">${m.role}</p>
        <p class="text-stone-400 text-xs mt-1">${m.bio}</p>
      </div>`).join('')}
    </div>
  </section>

  <section class="fade-up mb-12 bg-forest rounded-3xl p-8 text-center">
    <p class="text-gold text-sm font-semibold uppercase tracking-widest mb-2">Trust & Safety</p>
    <h2 class="font-serif text-2xl font-bold text-white mb-6">Certified. Tested. Trusted.</h2>
    <div class="flex flex-wrap justify-center gap-3">
      ${['FSSAI Licensed','USDA Organic','GMP Certified','ISO 9001:2015','Non-GMO Verified','Cruelty Free'].map(c=>`
      <span class="bg-white/15 text-white text-sm px-4 py-2 rounded-full border border-white/20 hover:bg-white/25 transition-colors">${c}</span>`).join('')}
    </div>
  </section>`;
  requestAnimationFrame(() => animateIn(el));
}

// ─── Page: Products ───────────────────────────────────────────────────────────
function renderProducts(el, params) {
  const cat = params.get('category') || state.activeCategory;
  state.activeCategory = cat;
  const categories = ['All', ...new Set(PRODUCTS.map(p => p.category))];

  el.innerHTML = `
  <div class="fade-up mb-8">
    <p class="text-herb text-sm font-semibold uppercase tracking-widest mb-1">Our Range</p>
    <h1 class="font-serif text-4xl font-bold text-earth">All Products</h1>
  </div>

  <div class="fade-up flex flex-col sm:flex-row gap-4 mb-6">
    <div class="relative flex-1 max-w-sm">
      <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm" aria-hidden="true">🔍</span>
      <input id="prod-search" type="search" placeholder="Search products…"
             value="${state.searchQuery}"
             class="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-herb/30 focus:border-herb bg-white"
             aria-label="Search products">
    </div>
  </div>

  <div class="fade-up flex gap-2 flex-wrap mb-8" role="tablist" aria-label="Filter by category">
    ${categories.map(c => `
    <button role="tab" aria-selected="${c === cat}" onclick="filterProducts('${c}')"
            class="category-tab text-sm px-4 py-2 rounded-full border transition-colors ${c === cat ? 'bg-forest text-white border-forest' : 'bg-white text-stone-600 border-stone-200 hover:border-herb hover:text-herb'}">
      ${c}
    </button>`).join('')}
  </div>

  <div id="prod-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" role="list" aria-label="Products">
    ${getFilteredCards(cat, state.searchQuery)}
  </div>`;

  const search = el.querySelector('#prod-search');
  search.addEventListener('input', debounce(() => {
    state.searchQuery = search.value.toLowerCase().trim();
    el.querySelector('#prod-grid').innerHTML = getFilteredCards(state.activeCategory, state.searchQuery);
  }, 250));

  requestAnimationFrame(() => animateIn(el));
}

function getFilteredCards(cat, query) {
  const results = PRODUCTS.filter(p =>
    (cat === 'All' || p.category === cat) &&
    (!query || p.name.toLowerCase().includes(query) || p.shortDesc.toLowerCase().includes(query) || p.category.toLowerCase().includes(query))
  );
  if (!results.length) return `
    <div class="col-span-full text-center py-20 text-stone-400">
      <p class="text-5xl mb-4" aria-hidden="true">🌿</p>
      <p class="text-lg font-semibold">No products found</p>
      <p class="text-sm mt-1">Try a different search term or category</p>
    </div>`;
  return results.map(p => `<div role="listitem">${productCard(p)}</div>`).join('');
}

function filterProducts(category) {
  state.activeCategory = category;
  state.searchQuery = '';
  navigate('products', category !== 'All' ? { category } : {});
}

// ─── Page: Product Detail ─────────────────────────────────────────────────────
function renderProduct(el, params) {
  const p = PRODUCTS.find(x => x.id === +params.get('id'));
  if (!p) {
    el.innerHTML = `<div class="text-center py-24">
      <p class="text-5xl mb-4" aria-hidden="true">🌿</p>
      <p class="text-stone-400 text-lg mb-4">Product not found.</p>
      <button onclick="navigate('products')" class="text-herb font-semibold hover:underline">← Back to Products</button>
    </div>`;
    return;
  }

  const disc = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const sameCategory = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id);
  const others = PRODUCTS.filter(x => x.category !== p.category && x.id !== p.id)
                         .sort((a, b) => b.stars - a.stars);
  const related = [...sameCategory, ...others].slice(0, 8);

  el.innerHTML = `
  <nav class="flex items-center gap-2 text-xs text-stone-400 mb-6 flex-wrap" aria-label="Breadcrumb">
    <button onclick="navigate('home')" class="hover:text-herb transition-colors">Home</button>
    <span aria-hidden="true">›</span>
    <button onclick="navigate('products')" class="hover:text-herb transition-colors">Products</button>
    <span aria-hidden="true">›</span>
    <button onclick="navigate('products',{category:'${p.category}'})" class="hover:text-herb transition-colors">${p.category}</button>
    <span aria-hidden="true">›</span>
    <span class="text-earth font-medium">${p.name}</span>
  </nav>

  <div class="fade-up grid md:grid-cols-2 gap-10 mb-16">
    <div>
      <div class="relative rounded-2xl overflow-hidden bg-stone-50 mb-3 aspect-square">
        <img id="gal-main" src="${p.gallery[0]}" alt="${p.name}"
             class="w-full h-full object-cover transition-opacity duration-200"
             style="min-height:300px"
             onerror="this.src='https://picsum.photos/seed/${p.id}/800/800'">
      </div>
      ${p.gallery.length > 1 ? `
      <div class="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Image gallery">
        ${p.gallery.map((img, i) => `
        <button onclick="switchGallery(${i},'${img}',this)"
                class="gal-thumb flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === 0 ? 'border-herb shadow-md' : 'border-stone-200 opacity-70 hover:opacity-100'}"
                aria-label="Image ${i + 1}" aria-pressed="${i === 0}">
          <img src="${img}" alt="View ${i + 1}" class="w-full h-full object-cover"
               onerror="this.src='https://picsum.photos/seed/${p.id}${i}/200/200'">
        </button>`).join('')}
      </div>` : ''}
    </div>

    <div>
      <div class="flex flex-wrap items-center gap-2 mb-2">
        <span class="text-xs text-herb font-semibold uppercase tracking-widest">${p.category}</span>
        ${p.badge ? `<span class="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-semibold">${p.badge}</span>` : ''}
      </div>
      <h1 class="font-serif text-3xl font-bold text-earth mb-2">${p.name}</h1>
      <div class="flex items-center gap-2 mb-4">
        <span aria-label="${p.stars} out of 5">${renderStars(p.stars)}</span>
        <span class="text-sm text-stone-400">${p.stars} (${p.reviews} reviews)</span>
      </div>
      <div class="flex items-end gap-3 mb-2">
        <span class="text-3xl font-bold text-earth">${fmtPrice(p.price)}</span>
        ${disc ? `<span class="text-lg text-stone-400 line-through">${fmtPrice(p.mrp)}</span>
        <span class="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">${disc}% OFF</span>` : ''}
      </div>
      <p class="text-xs text-stone-400 mb-4">Weight / Volume: <span class="text-stone-600 font-medium">${p.weight}</span></p>
      <p class="text-stone-600 text-sm mb-5">${p.shortDesc}</p>

      <div class="flex flex-wrap gap-2 mb-6">
        ${p.certs.map(c => `<span class="text-xs border border-herb/40 text-herb px-3 py-1 rounded-full">${c}</span>`).join('')}
      </div>

      <div class="flex flex-col gap-3">
        <button onclick="whatsappBuy('${p.name.replace(/'/g, "\\'")}')"
                class="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3.5 rounded-full hover:bg-green-600 transition-colors shadow-md text-base"
                aria-label="Buy ${p.name} via WhatsApp">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.18-.008-.38-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 0C5.373 0 0 5.373 0 12c0 2.117.547 4.103 1.504 5.832L0 24l6.335-1.462A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0"/>
          </svg>
          Buy via WhatsApp
        </button>
      </div>
    </div>
  </div>

  <div class="fade-up mb-16">
    <div class="flex border-b border-stone-200 mb-6" role="tablist" aria-label="Product information">
      ${['Description','Benefits','Usage & Ingredients'].map((tab, i) => `
      <button role="tab" aria-selected="${i === 0}" data-tab="${i}" onclick="switchTab(this,${i})"
              class="tab-btn px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${i === 0 ? 'border-herb text-herb' : 'border-transparent text-stone-400 hover:text-herb'}">
        ${tab}
      </button>`).join('')}
    </div>
    <div id="tab-0" class="tab-panel text-stone-600 leading-relaxed whitespace-pre-line text-sm">${p.desc}</div>
    <div id="tab-1" class="tab-panel hidden">
      <ul class="space-y-3">
        ${p.benefits.map(b => `
        <li class="flex items-start gap-3 text-stone-600 text-sm">
          <span class="text-herb mt-0.5 flex-shrink-0 font-bold" aria-hidden="true">✓</span>${b}
        </li>`).join('')}
      </ul>
    </div>
    <div id="tab-2" class="tab-panel hidden space-y-5 text-sm">
      <div>
        <h3 class="font-semibold text-earth mb-2">How to Use</h3>
        <p class="text-stone-600 leading-relaxed">${p.usage}</p>
      </div>
      <div>
        <h3 class="font-semibold text-earth mb-2">Ingredients</h3>
        <p class="text-stone-600 leading-relaxed">${p.ingredients}</p>
      </div>
    </div>
  </div>

  ${related.length ? `
  <section class="fade-up mb-12" aria-labelledby="related-h">
    <div class="flex items-center justify-between mb-6">
      <h2 id="related-h" class="font-serif text-2xl font-bold text-earth">You May Also Like</h2>
      <button onclick="navigate('products')" class="text-sm text-herb font-semibold hover:underline">View All →</button>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      ${related.map(productCard).join('')}
    </div>
  </section>` : ''}`;

  requestAnimationFrame(() => animateIn(el));
}

// ─── Page: Contact ────────────────────────────────────────────────────────────
function renderContact(el) {
  el.innerHTML = `
  <div class="fade-up mb-10">
    <p class="text-herb text-sm font-semibold uppercase tracking-widest mb-1">Get in Touch</p>
    <h1 class="font-serif text-4xl font-bold text-earth">Contact Us</h1>
  </div>

  <div class="grid md:grid-cols-5 gap-10 mb-16">
    <div class="fade-up md:col-span-3 bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
      <h2 class="font-serif text-xl font-semibold text-earth mb-6">Send Us a Message</h2>
      <form id="cf" novalidate aria-label="Contact form">
        <div class="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label for="cf-name" class="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              Full Name <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input type="text" id="cf-name" name="name" required autocomplete="name"
                   placeholder="Your full name"
                   class="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-herb/30 focus:border-herb transition-colors">
          </div>
          <div>
            <label for="cf-email" class="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              Email <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input type="email" id="cf-email" name="email" required autocomplete="email"
                   placeholder="you@example.com"
                   class="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-herb/30 focus:border-herb transition-colors">
          </div>
        </div>
        <div class="mb-4">
          <label for="cf-subject" class="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
            Subject <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input type="text" id="cf-subject" name="subject" required
                 placeholder="What is this about?"
                 class="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-herb/30 focus:border-herb transition-colors">
        </div>
        <div class="mb-6">
          <label for="cf-msg" class="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
            Message <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <textarea id="cf-msg" name="message" rows="5" required
                    placeholder="Tell us how we can help…"
                    class="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-herb/30 focus:border-herb transition-colors resize-none"></textarea>
        </div>
        <div id="cf-err" class="hidden mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm" role="alert"></div>
        <div id="cf-ok" class="hidden mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm" role="alert"></div>
        <button type="submit" id="cf-btn"
                class="w-full bg-forest text-white font-bold py-3 rounded-full hover:bg-herb transition-colors shadow-md">
          Send Message
        </button>
        <p class="text-xs text-stone-400 mt-3 text-center">We typically respond within 24 business hours.</p>
      </form>
    </div>

    <aside class="fade-up md:col-span-2 space-y-5">
      <div class="bg-amber-50 rounded-3xl p-6 border border-amber-100">
        <h2 class="font-serif text-lg font-semibold text-earth mb-4">Contact Information</h2>
        <div class="space-y-4">
          ${[
            { icon:'📍', label:'Address', val:'42 Wellness Tower, Connaught Place,<br>New Delhi – 110001' },
            { icon:'📞', label:'Phone', val:'<a href="tel:+919999999999" class="hover:text-herb transition-colors">+91 99999 99999</a>' },
            { icon:'✉️', label:'Email', val:'<a href="mailto:hello@esteeaura.com" class="hover:text-herb transition-colors">hello@esteeaura.com</a>' },
            { icon:'🕐', label:'Hours', val:'Mon–Sat: 9am – 7pm IST' },
          ].map(i=>`
          <div class="flex gap-3 items-start">
            <span class="text-xl flex-shrink-0" aria-hidden="true">${i.icon}</span>
            <div>
              <p class="text-xs text-stone-400 font-semibold uppercase tracking-wide">${i.label}</p>
              <p class="text-stone-700 text-sm leading-relaxed">${i.val}</p>
            </div>
          </div>`).join('')}
        </div>
      </div>

      <div class="bg-forest rounded-3xl p-6 text-white">
        <h3 class="font-serif text-lg font-semibold mb-2">Need Quick Help?</h3>
        <p class="text-white/70 text-sm mb-4">Chat with us directly on WhatsApp for fastest support.</p>
        <a href="https://wa.me/919999999999?text=Hi%20Est%C3%A9e%20Aura!%20I%20have%20a%20question."
           target="_blank" rel="noopener noreferrer"
           class="flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-2.5 px-4 rounded-full hover:bg-green-400 transition-colors w-full">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.18-.008-.38-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 0C5.373 0 0 5.373 0 12c0 2.117.547 4.103 1.504 5.832L0 24l6.335-1.462A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0"/>
          </svg>
          Chat on WhatsApp
        </a>
      </div>
    </aside>
  </div>

  <section class="fade-up mb-12" aria-labelledby="faq-h">
    <h2 id="faq-h" class="font-serif text-2xl font-bold text-earth mb-6">Frequently Asked Questions</h2>
    <div class="space-y-3">
      ${[
        { q:'Do you ship outside India?', a:'We currently ship across India via express courier. International shipping is planned for late 2025 — join our newsletter to be notified.' },
        { q:'Are products safe during pregnancy?', a:'Certain Ayurvedic herbs are contraindicated during pregnancy. Always consult your healthcare provider first. We label contraindications clearly on each product.' },
        { q:'What is your return policy?', a:'We accept returns within 7 days of delivery for unopened products. For quality concerns, contact us within 48 hours with photos.' },
        { q:'How do I know which product is right for me?', a:'Email or WhatsApp us — our in-house Ayurvedic consultant can suggest a personalised protocol at no charge.' },
      ].map(f=>`
      <details class="group bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <summary class="flex items-center justify-between p-5 cursor-pointer font-semibold text-earth text-sm hover:text-herb list-none">
          <span>${f.q}</span>
          <span class="text-stone-400 group-open:rotate-45 transition-transform flex-shrink-0 ml-4 text-xl font-light" aria-hidden="true">+</span>
        </summary>
        <div class="px-5 pb-5 text-stone-500 text-sm leading-relaxed border-t border-stone-100 pt-4">${f.a}</div>
      </details>`).join('')}
    </div>
  </section>`;

  // Form handler
  el.querySelector('#cf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const btn  = form.querySelector('#cf-btn');
    const errEl = form.querySelector('#cf-err');
    const okEl  = form.querySelector('#cf-ok');
    errEl.classList.add('hidden');
    okEl.classList.add('hidden');

    const data = {
      name:    form.querySelector('#cf-name').value.trim(),
      email:   form.querySelector('#cf-email').value.trim(),
      subject: form.querySelector('#cf-subject').value.trim(),
      message: form.querySelector('#cf-msg').value.trim(),
    };

    if (!data.name || !data.email || !data.subject || !data.message) {
      errEl.textContent = 'Please fill in all required fields.';
      errEl.classList.remove('hidden');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errEl.textContent = 'Please enter a valid email address.';
      errEl.classList.remove('hidden');
      return;
    }

    btn.textContent = 'Sending…';
    btn.disabled = true;

    try {
      // NOTE: Replace SHEET_URL with your Google Apps Script Web App URL
      // The Apps Script should accept POST with JSON body and write to your Google Sheet.
      const SHEET_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

      await fetch(SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, timestamp: new Date().toISOString() }),
      });

      okEl.innerHTML = `<strong>Message sent!</strong> Thank you, ${data.name}. We'll get back to you within 24 hours.`;
      okEl.classList.remove('hidden');
      form.reset();
    } catch {
      errEl.textContent = 'Something went wrong. Please try again or reach us via WhatsApp.';
      errEl.classList.remove('hidden');
    } finally {
      btn.textContent = 'Send Message';
      btn.disabled = false;
    }
  });

  requestAnimationFrame(() => animateIn(el));
}

// ─── Tab & Gallery ────────────────────────────────────────────────────────────
function switchTab(btn, idx) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.replace('border-herb', 'border-transparent');
    b.classList.replace('text-herb', 'text-stone-400');
    b.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  btn.classList.replace('border-transparent', 'border-herb');
  btn.classList.replace('text-stone-400', 'text-herb');
  btn.setAttribute('aria-selected', 'true');
  document.getElementById(`tab-${idx}`)?.classList.remove('hidden');
}

function switchGallery(idx, src, btn) {
  const main = document.getElementById('gal-main');
  if (!main) return;
  main.style.opacity = '0';
  setTimeout(() => { main.src = src; main.style.opacity = '1'; }, 180);
  document.querySelectorAll('.gal-thumb').forEach(b => {
    b.classList.replace('border-herb', 'border-stone-200');
    b.classList.remove('shadow-md');
    b.classList.add('opacity-70');
    b.setAttribute('aria-pressed', 'false');
  });
  btn.classList.replace('border-stone-200', 'border-herb');
  btn.classList.add('shadow-md');
  btn.classList.remove('opacity-70');
  btn.setAttribute('aria-pressed', 'true');
}

// ─── Router ───────────────────────────────────────────────────────────────────
const RENDERERS = { home: renderHome, about: renderAbout, products: renderProducts, product: renderProduct, contact: renderContact };

function route() {
  let page, params;
  if (history.state && history.state.page) {
    page   = history.state.page;
    params = new URLSearchParams(history.state.params || {});
  } else {
    // Parse page from pathname: /about → "about", / → "home"
    const segment = window.location.pathname
      .replace(_BASE, '')
      .replace(/^\//, '')
      .replace(/\/+$/, '') || 'home';
    page   = segment === 'index.html' ? 'home' : segment;
    params = new URLSearchParams(window.location.search);
  }
  const key = RENDERERS[page] ? page : 'home';

  document.querySelectorAll('[data-page]').forEach(el => el.style.display = 'none');
  // Clear hero slot when navigating away from home
  if (key !== 'home') {
    const hs = document.getElementById('hero-slot');
    if (hs) { hs.innerHTML = ''; if (_heroTimer) { clearInterval(_heroTimer); _heroTimer = null; } }
  }
  const container = document.querySelector(`[data-page="${key}"]`);
  if (container) {
    container.style.display = 'block';
    RENDERERS[key](container, params);
  }

  document.querySelectorAll('[data-nav]').forEach(a => {
    a.classList.toggle('nav-active', a.dataset.nav === key);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function initSidebar() {
  const overlay   = document.getElementById('overlay');
  const mSidebar  = document.getElementById('sidebar-mobile');
  const openBtn   = document.getElementById('sidebar-open');
  const closeBtn  = document.getElementById('sidebar-close');

  function openSidebar() {
    mSidebar.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  }
  function closeSidebar() {
    mSidebar.classList.add('translate-x-full');
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  openBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });

  // Populate sidebar best sellers (desktop + mobile)
  const picks = PRODUCTS.filter(p => p.badge === 'Best Seller').slice(0, 3);
  const html = picks.map(p => `
    <button onclick="navigate('product',{id:${p.id}});document.getElementById('overlay')?.click()"
            class="flex items-center gap-3 w-full text-left p-2 rounded-xl hover:bg-amber-50 transition-colors group">
      <img src="${p.img}" alt="${p.name}" class="w-14 h-14 rounded-lg object-cover flex-shrink-0"
           onerror="this.src='https://picsum.photos/seed/${p.id}/100/100'">
      <div class="min-w-0">
        <p class="text-sm font-semibold text-earth truncate">${p.name}</p>
        <p class="text-xs text-stone-400 truncate">${p.weight}</p>
        <p class="text-sm font-bold text-herb">${fmtPrice(p.price)}</p>
      </div>
    </button>`).join('');

  document.querySelectorAll('[data-sidebar-products]').forEach(el => el.innerHTML = html);
}

// ─── Mobile nav ───────────────────────────────────────────────────────────────
function initMobileNav() {
  const btn     = document.getElementById('mobile-menu-btn');
  const drawer  = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const closeBtn = document.getElementById('drawer-close');

  function openDrawer() {
    drawer.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.remove('opacity-0'));
    document.body.style.overflow = 'hidden';
    btn.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    drawer.classList.add('translate-x-full');
    overlay.classList.add('opacity-0');
    setTimeout(() => overlay.classList.add('hidden'), 300);
    document.body.style.overflow = '';
    btn.setAttribute('aria-expanded', 'false');
  }

  btn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  drawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  updateCartBadge();
  window.addEventListener('popstate', route);

  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-nav], a[href^="#"]');
    if (!a) return;
    const pg = a.dataset.nav || a.getAttribute('href').replace(/^#/, '').split('?')[0];
    if (pg && RENDERERS[pg]) {
      e.preventDefault();
      const qs = (a.getAttribute('href') || '').split('?')[1] || '';
      navigate(pg, Object.fromEntries(new URLSearchParams(qs)));
    }
  });

  route();
});

// Global exports for inline onclick handlers
window.navigate = navigate;
window.filterProducts = filterProducts;
window.switchTab = switchTab;
window.switchGallery = switchGallery;
window.whatsappBuy = whatsappBuy;
window.addToCart = addToCart;
window.showToast = showToast;
window.initHeroSlider = initHeroSlider;
