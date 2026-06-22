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

// ─── Page: Home ───────────────────────────────────────────────────────────────
function renderHome(el) {
  const featured = PRODUCTS.filter(p => p.badge).slice(0, 4);

  const heroImgs = [
    'https://images.pexels.com/photos/4589169/pexels-photo-4589169.jpeg?auto=compress&cs=tinysrgb&w=1400',
    'https://images.pexels.com/photos/7829483/pexels-photo-7829483.jpeg?auto=compress&cs=tinysrgb&w=1400',
    'https://images.pexels.com/photos/4871315/pexels-photo-4871315.jpeg?auto=compress&cs=tinysrgb&w=1400',
  ];

  // Render hero into its own full-width slot (outside <main>'s padding)
  const heroSlot = document.getElementById('hero-slot');
  if (heroSlot) {
    heroSlot.innerHTML = `
  <section class="relative w-full overflow-hidden"
           style="height:calc(100vh - 72px);min-height:560px;max-height:900px"
           aria-label="Hero slideshow">

    ${heroImgs.map((src, i) => `
    <div class="hero-slide absolute inset-0 bg-cover bg-center bg-no-repeat"
         style="background-image:url('${src}');opacity:${i === 0 ? 1 : 0};transition:opacity 1.2s ease-in-out"
         role="img" aria-hidden="${i !== 0}"></div>`).join('')}

    <div class="absolute inset-0 bg-black/50"></div>
    <div class="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40"></div>

    <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-5 sm:px-10">
      <p class="text-gold text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-3 sm:mb-4">
        Since 2018 &nbsp;·&nbsp; Certified Organic
      </p>
      <h1 class="font-serif font-bold text-white leading-tight mb-4 sm:mb-5"
          style="font-size:clamp(2rem,6vw,4.5rem)">
        Ancient Wisdom,<br>
        <em class="not-italic" style="color:#D4AC0D">Modern Wellness</em>
      </h1>
      <p class="text-white/80 leading-relaxed mb-7 sm:mb-9"
         style="font-size:clamp(0.85rem,2vw,1.1rem);max-width:520px">
        Discover the healing power of authentic Ayurveda — crafted from the finest organic herbs, following formulations passed down through generations.
      </p>
      <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0">
        <a href="#products"
           class="bg-herb text-white font-bold px-8 py-3.5 rounded-full hover:bg-forest transition-colors shadow-lg text-sm sm:text-base text-center">
          Shop Now
        </a>
        <a href="#about"
           class="border-2 border-white/60 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/15 transition-colors text-sm sm:text-base text-center">
          Our Story
        </a>
      </div>
    </div>

    <div class="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
      ${heroImgs.map((_, i) => `
      <div class="hero-dot rounded-full bg-white"
           style="height:6px;width:${i === 0 ? '28px' : '8px'};opacity:${i === 0 ? 1 : 0.35};transition:all 0.45s ease"></div>`).join('')}
    </div>
  </section>`;
  }

  el.innerHTML = `
  <section class="fade-up grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 mt-10" aria-label="Trust badges">
    ${[
      { icon: '🌿', label: 'USDA Organic', sub: '100% Certified' },
      { icon: '🔬', label: 'Lab Tested', sub: 'Every Batch' },
      { icon: '🌱', label: 'Non-GMO', sub: 'Always Pure' },
      { icon: '✈️', label: 'Free Shipping', sub: 'Orders ₹999+' },
    ].map(t => `
    <div class="flex flex-col items-center text-center bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
      <span class="text-3xl mb-2" aria-hidden="true">${t.icon}</span>
      <span class="font-semibold text-earth text-sm">${t.label}</span>
      <span class="text-xs text-stone-400">${t.sub}</span>
    </div>`).join('')}
  </section>

  <section class="fade-up mb-16" aria-labelledby="featured-h">
    <div class="flex items-end justify-between mb-8">
      <div>
        <p class="text-herb text-sm font-semibold uppercase tracking-widest mb-1">Handpicked</p>
        <h2 id="featured-h" class="font-serif text-3xl font-bold text-earth">Best Sellers</h2>
      </div>
      <a href="#products" class="text-herb text-sm font-semibold hover:text-forest transition-colors">View All →</a>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      ${featured.map(productCard).join('')}
    </div>
  </section>

  <section class="fade-up grid md:grid-cols-2 gap-12 items-center mb-16 bg-amber-50 rounded-3xl p-8 md:p-12 border border-amber-100" aria-labelledby="about-teaser-h">
    <div>
      <p class="text-herb text-sm font-semibold uppercase tracking-widest mb-2">Our Mission</p>
      <h2 id="about-teaser-h" class="font-serif text-3xl font-bold text-earth mb-4">
        Rooted in Tradition,<br>Driven by Science
      </h2>
      <p class="text-stone-600 leading-relaxed mb-4">
        Estée Aura was founded with a single belief: that the world's oldest wellness system holds answers to modern health challenges. We bridge ancient texts and modern quality standards to bring you products that truly work.
      </p>
      <p class="text-stone-600 leading-relaxed mb-6">
        Every herb is traced to its source. Every formulation is reviewed by certified Ayurvedic practitioners. Every batch is independently lab-tested.
      </p>
      <a href="#about" class="inline-flex items-center gap-2 text-herb font-semibold hover:text-forest transition-colors">
        Read Our Story →
      </a>
    </div>
    <div class="relative">
      <img src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80"
           alt="Ayurvedic herbs being prepared" class="rounded-2xl shadow-xl w-full h-72 object-cover">
      <div class="absolute -bottom-4 -left-4 bg-forest text-white rounded-xl p-4 shadow-xl">
        <p class="font-serif text-2xl font-bold">8+</p>
        <p class="text-xs text-white/75">Years of Trust</p>
      </div>
      <div class="absolute -top-4 -right-4 bg-gold text-earth rounded-xl p-4 shadow-xl">
        <p class="font-serif text-2xl font-bold">40K+</p>
        <p class="text-xs font-semibold">Customers</p>
      </div>
    </div>
  </section>

  <section class="fade-up mb-16" aria-labelledby="diff-h">
    <div class="text-center mb-10">
      <p class="text-herb text-sm font-semibold uppercase tracking-widest mb-1">Why Choose Us</p>
      <h2 id="diff-h" class="font-serif text-3xl font-bold text-earth">The Estée Aura Difference</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      ${[
        { icon: '🌾', title: 'Source-Traced Herbs', desc: 'Every herb is traceable to its farm, region, and harvest batch. We visit our partner farms regularly and test soil quality.' },
        { icon: '⚗️', title: 'Traditional Methods', desc: 'Cold-pressed oils, stone-ground powders, copper-vessel cooking — processes that unlock maximum potency.' },
        { icon: '🛡️', title: 'Third-Party Testing', desc: 'Every product is independently tested for heavy metals, pesticides, microbials, and potency. COAs available on request.' },
      ].map(b => `
      <div class="bg-white rounded-2xl p-6 border border-stone-100 hover:shadow-lg transition-shadow">
        <div class="text-4xl mb-4" aria-hidden="true">${b.icon}</div>
        <h3 class="font-serif text-lg font-semibold text-earth mb-2">${b.title}</h3>
        <p class="text-stone-500 text-sm leading-relaxed">${b.desc}</p>
      </div>`).join('')}
    </div>
  </section>

  <section class="fade-up mb-16 bg-forest rounded-3xl p-8 md:p-12" aria-labelledby="reviews-h">
    <div class="text-center mb-10">
      <p class="text-gold text-sm font-semibold uppercase tracking-widest mb-1">What Customers Say</p>
      <h2 id="reviews-h" class="font-serif text-3xl font-bold text-white">Real Results, Real People</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      ${[
        { name: 'Priya S.', city: 'Mumbai', text: "The Ashwagandha powder has genuinely changed my sleep quality and how I handle workplace stress. I've tried 4 other brands — this is the only one that worked.", prod: 'Ashwagandha Root Powder' },
        { name: 'Arjun M.', city: 'Bengaluru', text: "Chyawanprash every morning with milk. Six months in and I haven't had a single cold. My wife jokes I've become an Ayurveda evangelist.", prod: 'Chyawanprash Premium' },
        { name: 'Neha R.', city: 'Delhi', text: "The Kumkumadi oil is worth every rupee. Three weeks in and colleagues are asking what I changed in my skincare routine. Absolutely glowing.", prod: 'Kumkumadi Skin Elixir' },
      ].map(t => `
      <blockquote class="bg-white/10 rounded-2xl p-6 text-white">
        <div class="text-amber-400 mb-3 text-sm" aria-label="5 star rating">★★★★★</div>
        <p class="text-white/85 text-sm leading-relaxed mb-4 italic">"${t.text}"</p>
        <footer>
          <p class="font-semibold text-sm">${t.name}</p>
          <p class="text-white/55 text-xs">${t.city} · ${t.prod}</p>
        </footer>
      </blockquote>`).join('')}
    </div>
  </section>

  <section class="fade-up mb-12 bg-gradient-to-r from-amber-50 to-amber-100 rounded-3xl p-10 text-center border border-amber-200">
    <h2 class="font-serif text-3xl font-bold text-earth mb-3">Begin Your Wellness Journey</h2>
    <p class="text-stone-500 mb-6 max-w-lg mx-auto">Explore our full range of authentic Ayurvedic products, crafted with tradition and tested with science.</p>
    <a href="#products" class="inline-block bg-forest text-white font-bold px-10 py-3 rounded-full hover:bg-herb transition-colors shadow-md">
      Shop All Products
    </a>
  </section>`;
  requestAnimationFrame(() => { animateIn(el); initHeroSlider(); });
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
      <a href="#products" class="text-herb font-semibold hover:underline">← Back to Products</a>
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
    <a href="#home" class="hover:text-herb transition-colors">Home</a>
    <span aria-hidden="true">›</span>
    <a href="#products" class="hover:text-herb transition-colors">Products</a>
    <span aria-hidden="true">›</span>
    <a href="#products?category=${encodeURIComponent(p.category)}" class="hover:text-herb transition-colors">${p.category}</a>
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
      <a href="#products" class="text-sm text-herb font-semibold hover:underline">View All →</a>
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
  initSidebar();
  initMobileNav();
  updateCartBadge();
  window.addEventListener('popstate', route);

  // Intercept all nav link clicks — handle both [data-nav] and href="#page"
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-nav], a[href^="#"]');
    if (!a) return;
    const pg = a.dataset.nav || a.getAttribute('href').replace(/^#/, '');
    if (pg && RENDERERS[pg]) {
      e.preventDefault();
      navigate(pg);
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
