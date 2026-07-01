'use strict';

const PRODUCTS = [
  {
    id: 1,
    name: "Lumi Correct Cream",
    category: "Skincare",
    shortDesc: "Ayurvedic Botanical Radiance cream for bright, even-toned skin",
    price: 1000, mrp: 1299, weight: "50g", stars: 4.8, reviews: 124,
    badge: "Best Seller",
    img: "facecream.png",
    gallery: [
      "facecream.png",
      "Product-4.jpeg",
      "Product-1.jpeg"
    ],
    desc: "Lumi Correct Cream is a luxurious Ayurvedic botanical radiance cream formulated to brighten, correct, and illuminate your complexion. Inspired by centuries-old Ayurvedic wisdom, this rich yet lightweight cream works to visibly reduce dark spots, uneven skin tone, and dullness — revealing naturally radiant, glowing skin.\n\nCrafted with a potent blend of time-tested herbs and botanicals, each jar delivers deep nourishment while gently correcting pigmentation. Suitable for all skin types, it works with your skin's natural rhythm for lasting luminosity.",
    benefits: [
      "Brightens complexion and reduces dark spots",
      "Evens skin tone and corrects pigmentation",
      "Deeply nourishes and hydrates skin",
      "Imparts a natural, botanical radiance",
      "Suitable for all skin types"
    ],
    usage: "Cleanse your face thoroughly. Take a small amount of cream and apply evenly on face and neck. Gently massage in circular motions until absorbed. Use morning and night for best results.",
    ingredients: "Ayurvedic Botanical Extracts, Herbal Actives, Natural Emollients, Skin-Safe Preservatives, Fragrance",
    certs: ["Ayurvedic Formulation", "Botanical Ingredients", "Dermatologically Tested", "Cruelty Free"]
  },
  {
    id: 2,
    name: "Kumkumadi Face Pack",
    category: "Skincare",
    shortDesc: "Ancient saffron-herb powder mask for radiant, even-toned skin",
    price: 1200, mrp: 1499, weight: "100g", stars: 4.7, reviews: 98,
    badge: "Top Rated",
    img: "facemask.png",
    gallery: [
      "facemask.png",
      "Product-2.jpeg"
    ],
    desc: "Our Kumkumadi Face Pack is a traditional Ayurvedic herbal powder blend inspired by the legendary Kumkumadi Tailam — one of Ayurveda's most revered skincare formulations. This beautifully crafted mask combines Rakta Chandan (Red Sandalwood), Manjistha, Mulethi, precious Kesar Threads (Saffron), and aromatic essential oils to deliver a truly transformative skincare ritual.\n\nEach application gently exfoliates, brightens, and purifies while the herbs work synergistically to reduce blemishes and impart a luminous, even-toned glow. The addition of Vetiver and Orange Essential Oil gives the mask a grounding, calming fragrance.",
    benefits: [
      "Brightens and illuminates dull skin",
      "Reduces blemishes, dark spots and uneven tone",
      "Gently exfoliates and deep-cleanses pores",
      "Soothes and calms irritated or sensitive skin",
      "Leaves skin soft, smooth and radiant"
    ],
    usage: "Cleanse your face properly before application. Mix 1–2 teaspoons with rose water or plain water to form a smooth paste. Apply a thin, even layer on face and neck. Leave for 10–15 minutes or until semi-dry. Rinse gently with lukewarm water and pat dry. Use 2–3 times per week for best results.",
    ingredients: "Rakta Chandan (Red Sandalwood), Swet Chandan (White Sandalwood), Manjistha, Mulethi (Licorice), Nagkesar, Lodhra, Vacha, Rose Powder, Dasmool, Kesar Threads (Saffron), Vetiver Essential Oil, Orange Essential Oil",
    certs: ["100% Natural Herbs", "No Chemicals", "Traditional Ayurvedic Formula", "Cruelty Free"]
  },
  {
    id: 3,
    name: "True-Glow Serum",
    category: "Skincare",
    shortDesc: "Lightweight botanical serum for flawless, luminous skin",
    price: 750, mrp: 999, weight: "30ml", stars: 4.9, reviews: 76,
    badge: "New Arrival",
    img: "Serum.png",
    gallery: [
      "Serum.png",
      "Product-3.jpeg"
    ],
    desc: "True-Glow Serum is a potent, fast-absorbing botanical serum designed to deliver intense brightening and hydration in one lightweight formula. Infused with skin-loving plant actives, this serum penetrates deep into the skin layers to correct dark spots, boost radiance, and create a naturally flawless complexion.\n\nPerfect as a daily serum under your moisturiser or cream, True-Glow Serum works with all skin types and tones to reveal your skin's natural luminosity.",
    benefits: [
      "Intensely brightens and evens skin tone",
      "Reduces dark spots and hyperpigmentation",
      "Provides deep, lasting hydration",
      "Fast-absorbing, lightweight formula",
      "Boosts natural glow and radiance"
    ],
    usage: "After cleansing and toning, apply 2–3 drops onto face and neck. Gently press and pat into skin until fully absorbed. Follow with Lumi Correct Cream for enhanced results. Use morning and/or evening.",
    ingredients: "Purified Water (Aqua), Plant-Derived Actives, Botanical Brightening Complex, Glycerine, Hyaluronic Acid, Green Tea Extract, Niacinamide, Skin-Safe Preservatives, Fragrance",
    certs: ["Botanical Formula", "Dermatologically Tested", "Paraben Free", "Cruelty Free"]
  },
  {
    id: 4,
    name: "Natural Glow Face Wash",
    category: "Skincare",
    shortDesc: "Infused with Green Tea & Licorice Extracts — Gently Cleanses • Revives Radiance • Softens Skin",
    price: 550, mrp: 699, weight: "150 ml", stars: 4.6, reviews: 61,
    badge: "Popular",
    img: "facewash .png",
    gallery: [
      "facewash .png",
      "Product-3.jpeg"
    ],
    desc: "Estee Aura Natural Glow Face Wash is a gentle foaming cleanser crafted with carefully selected botanical extracts to purify the skin, remove daily impurities, and restore a naturally healthy glow. Enriched with Green Tea and Licorice, it helps refresh dull skin while maintaining softness and hydration.\n\nSulphate Free • Paraben Free\n\nManufactured by: Gursewak Ayurvedic, Patiala\nCustomer Care: +91 98144 82956",
    benefits: [
      "Cleanses without stripping natural moisture",
      "Helps improve skin's fresh, radiant appearance",
      "Leaves skin soft, smooth, and refreshed",
      "Suitable for everyday use"
    ],
    usage: "Dispense a small amount onto damp skin. Massage gently in circular motions and rinse thoroughly. Use morning and evening for best results.",
    ingredients: "Purified Water (Aqua), Mild Plant-Derived Cleansers (Decyl Glucoside, Cocamidopropyl Betaine), Glycerin, Green Tea Extract (Camellia Sinensis), Licorice Extract (Glycyrrhiza Glabra), Aloe Vera Extract (Aloe Barbadensis), Xanthan Gum, Skin-Safe Preservative, Fragrance.",
    certs: ["Sulphate Free", "Paraben Free", "Dermatologically Tested", "Cruelty Free"]
  }
];
