export interface Disease {
  id: string;
  name: string;
  scientific: string;
  type: string;
  anatomy: string[];
  severity: string;
  desc: string;
  symptoms: string[];
  riskFactors: string[];
  treatment: {
    immediate: string;
    chemical: string;
    organic: string;
    preventive: string;
  };
}

export interface LogEntry {
  id: string;
  date: string;
  field: string;
  disease: string;
  severity: number;
  acres: number;
  notes: string;
}

export const DISEASE_DATABASE: Disease[] = [
  {
    id: "leaf_rust",
    name: "Leaf Rust",
    scientific: "Puccinia triticina",
    type: "fungal",
    anatomy: ["leaves"],
    severity: "Moderate",
    desc: "Leaf rust is the most common rust disease of wheat. It is caused by a fungal pathogen that targets leaves, causing pustules that rupture the leaf tissue, disrupting photosynthesis and accelerating water loss.",
    symptoms: [
      "Small round orange-brown pustules on leaf surfaces",
      "Pustules rub off easily, leaving a rusty powder on fingers",
      "Yellow halos (chlorosis) surrounding older pustules",
      "Premature leaf drying (necrosis) in severe infections"
    ],
    riskFactors: [
      "Warm temperatures between 15°C and 22°C",
      "Frequent rainfall or heavy overnight dew",
      "High nitrogen fertilizer application (dense canopy)",
      "Susceptible wheat cultivars in neighboring fields"
    ],
    treatment: {
      immediate: "Apply a foliar triazole or strobilurin fungicide if threshold (1-2% leaf area infected) is breached on the flag leaf minus one.",
      chemical: "Foliar Fungicides: Triazoles (Tebuconazole, Propiconazole) or Strobilurins (Pyraclostrobin). Apply at flag leaf emergence.",
      organic: "Ensure wide spacing and apply copper-based organic fungicides or bio-fungicides containing Bacillus subtilis as early-season preventatives.",
      preventive: "Plant leaf-rust-resistant wheat cultivars. Eliminate volunteer wheat crop ('green bridges') before planting."
    }
  },
  {
    id: "stem_rust",
    name: "Stem Rust",
    scientific: "Puccinia graminis",
    type: "fungal",
    anatomy: ["stem", "leaves"],
    severity: "High",
    desc: "Stem rust (black rust) is a highly destructive disease capable of turning a healthy crop into a tangled mass of broken stems just weeks before harvest. It restricts nutrient flow to the heads, causing severe lodging and shriveled grains.",
    symptoms: [
      "Elongated reddish-brown pustules on stems, leaf sheaths, and leaves",
      "Pustules rupture the outer epidermis with ragged, peeling edges",
      "Spore powder turns dark brown to black late in the season",
      "Weakened stems leading to severe lodging (falling over)"
    ],
    riskFactors: [
      "Warm days (20°C to 30°C) and mild nights",
      "Wet conditions from rain, dew, or overhead irrigation",
      "Nearby presence of barberry plants (the alternate host)",
      "Late planting or late-maturing varieties"
    ],
    treatment: {
      immediate: "A chemical fungicide must be applied immediately if stem rust is identified in the area, particularly before or at flowering.",
      chemical: "Apply systemic fungicides: Triazole-Strobilurin mixes (e.g., Tebuconazole + Trifloxystrobin) to provide curative and residual defense.",
      organic: "Destroy alternate hosts (barberry plants) within 1 km of the field. Organic applications are rarely effective once stem rust establishes.",
      preventive: "The primary control is genetic resistance ( cultivars with Sr genes). Plant early-maturing wheat."
    }
  },
  {
    id: "stripe_rust",
    name: "Stripe Rust",
    scientific: "Puccinia striiformis",
    type: "fungal",
    anatomy: ["leaves", "head"],
    severity: "High",
    desc: "Stripe rust (yellow rust) thrives in cooler temperatures. It forms distinct yellow pustules arranged in linear stripes along the veins of wheat leaves. Severe infections can spread to the heads, destroying spikelets.",
    symptoms: [
      "Bright yellow-orange pustules arranged in linear stripes (stripes) on leaves",
      "Linear lesions on leaf sheaths and inner glumes of spikelets",
      "Pitted leaf appearance where tissue dies underneath stripes",
      "Bleached heads containing shriveled, unviable kernels"
    ],
    riskFactors: [
      "Cool temperatures between 10°C and 16°C",
      "High relative humidity, misty rain, or heavy fog",
      "Cool, wet spring seasons following mild winters",
      "Over-fertilized, lush green wheat canopies"
    ],
    treatment: {
      immediate: "Check susceptibility of the variety. Spray foliar fungicide immediately if stripe rust is active during tillering or jointing.",
      chemical: "Fungicides containing SDHIs (e.g., Fluxapyroxad) or Triazoles (Propiconazole, Tebuconazole). Ensure coverage of the flag leaf.",
      organic: "Apply biological solutions such as Trichoderma harzianum, and optimize field microclimate by reducing seeding density.",
      preventive: "Grow stripe-rust-resistant wheat. Manage sowing dates to avoid the cool, wet periods coinciding with major spore flights."
    }
  },
  {
    id: "powdery_mildew",
    name: "Powdery Mildew",
    scientific: "Blumeria graminis",
    type: "fungal",
    anatomy: ["leaves", "stem"],
    severity: "Moderate",
    desc: "Powdery mildew appears as fluffy white patches on leaves and stems. As the fungus matures, the white spots turn gray-brown with small black pepper-like structures (cleistothecia). It thrives in lush, high-density canopies.",
    symptoms: [
      "White, fluffy, cottony patches of fungal mycelium on leaves and stems",
      "Patches turn gray-brown and develop tiny black specks as they age",
      "Yellowing (chlorosis) of the leaf tissue surrounding the patches",
      "Defoliation of lower leaves, reducing grain-fill efficiency"
    ],
    riskFactors: [
      "Cool (15°C to 20°C), humid, and cloudy weather",
      "Lush, dense vegetative canopy from excess nitrogen",
      "Lack of direct sunlight and low wind movement in the canopy",
      "Dry soil conditions with high relative atmospheric humidity"
    ],
    treatment: {
      immediate: "If powdery mildew reaches the upper two leaves before heading, apply a registered foliar fungicide.",
      chemical: "Chemical classes: Quinoxyfen (specific for mildew) or DMIs (Tebuconazole) or SDHIs. Apply early in the epidemic.",
      organic: "Spray potassium bicarbonate or sulfur-based contact fungicides. Prune adjacent weeds to increase canopy airflow.",
      preventive: "Avoid excessive nitrogen applications. Seed at recommended densities to improve air circulation."
    }
  },
  {
    id: "septoria",
    name: "Septoria Leaf Blotch",
    scientific: "Mycosphaerella graminicola",
    type: "fungal",
    anatomy: ["leaves"],
    severity: "Moderate",
    desc: "Septoria Tritici Blotch is a major foliar disease. It starts as light green flecks that develop into tan, rectangular, lens-shaped lesions speckled with tiny black dots (pycnidia). Rain splash spreads spores up the canopy.",
    symptoms: [
      "Lens-shaped, tan-to-brown lesions on leaves, running parallel to leaf veins",
      "Tiny, black, pin-head sized dots (pycnidia) embedded inside the lesions",
      "Coalesced lesions causing large sections of leaf to wither and turn brown",
      "Occurs first on lower leaves, moving upward following heavy rains"
    ],
    riskFactors: [
      "Cool (15°C to 20°C), wet, rainy weather",
      "Rain-splashing events that transport spores up the plant canopy",
      "Wheat-on-wheat crop rotation history",
      "Infected crop residue left on the soil surface"
    ],
    treatment: {
      immediate: "Monitor flag leaf emergence. If rain persists and symptoms are present on leaf 3, apply a preventative/curative fungicide.",
      chemical: "SDHI + DMI co-formulations (e.g., Benzovindiflupyr + Prothioconazole) or Strobilurins. Multi-site protectants like Folpet help prevent resistance.",
      organic: "Apply copper hydroxide sprays or compost tea extracts. Work crop residues into the soil to accelerate decomposition.",
      preventive: "Rotate crops (avoid cereals for 2 years). Practice deep tillage to bury infected stubble. Sowing later in autumn."
    }
  },
  {
    id: "head_blight",
    name: "Fusarium Head Blight",
    scientific: "Fusarium graminearum",
    type: "fungal",
    anatomy: ["head"],
    severity: "High",
    desc: "Fusarium Head Blight (scab) attacks the heads during flowering. It causes premature bleaching of spikelets and leads to shriveled, chalky grains ('tombstones') contaminated with vomitoxins (DON), rendering them toxic to livestock and humans.",
    symptoms: [
      "Premature bleaching (straw color) of individual spikelets or the entire head",
      "Pinkish-orange fungal spore masses (sporodochia) visible at the base of spikelets",
      "Dark brown necrosis on the stem just below the head (peduncle)",
      "Shriveled, lightweight, chalky-white or pinkish-purple kernels"
    ],
    riskFactors: [
      "Warm (18°C to 30°C) and wet/humid weather during flowering (anthesis)",
      "Frequent rainfall, heavy fog, or overhead irrigation during heading",
      "Planting wheat directly into corn or sorghum stubble (shared pathogen)",
      "Susceptible varieties undergoing flowering"
    ],
    treatment: {
      immediate: "A preventative fungicide must be applied precisely at early flowering (Feekes 10.5.1) if weather forecasts predict rain.",
      chemical: "Triazole fungicides: Prothioconazole (Proline) or Metconazole (Caramba) or Pydiflumetofen (Miravis Ace). Apply at 10.5.1. Avoid strobilurins as they can increase mycotoxin levels.",
      organic: "Spray bio-fungicides like Bacillus amyloliquefaciens at anthesis. Mow corn stalk residues before planting wheat.",
      preventive: "Rotate crop away from corn. Sowing varieties with moderate resistance. Harvest infected fields early and separate light kernels."
    }
  },
  {
    id: "loose_smut",
    name: "Loose Smut",
    scientific: "Ustilago tritici",
    type: "fungal",
    anatomy: ["head"],
    severity: "Moderate",
    desc: "Loose smut replaces the wheat kernels with a mass of olive-black fungal spores. The disease is seed-borne; the fungus lives inside the seed embryo and grows systemically inside the plant without showing symptoms until heading.",
    symptoms: [
      "Grain heads completely replaced by olive-black, dusty spore masses",
      "Spores are enclosed in a delicate membrane that rips easily",
      "Naked spike stems (rachis) remaining after wind blows spores away",
      "Smutted heads emerge slightly earlier than healthy heads"
    ],
    riskFactors: [
      "Sowing untreated seed saved from previous infected harvests",
      "Cool, moist weather (16°C to 22°C) during flowering of the parent crop",
      "Low wind blockages, allowing spores to blow from infected heads"
    ],
    treatment: {
      immediate: "No foliar treatment is effective during the growing season. Smutted heads must be flagged, and seeds from the field must not be saved.",
      chemical: "Systemic seed treatment fungicides: Difenoconazole, Triticonazole, or Carboxin. This is 99% effective at preventing the disease.",
      organic: "Soak seed in hot water (49°C) for 11 minutes before planting to kill internal mycelium, or use certified smut-free organic seed.",
      preventive: "Always plant certified disease-free seed. Clean harvesting equipment to prevent spreading spores."
    }
  },
  {
    id: "take_all",
    name: "Take-all Root Rot",
    scientific: "Gaeumannomyces graminis",
    type: "fungal",
    anatomy: ["roots"],
    severity: "Moderate",
    desc: "Take-all is a soil-borne disease that attacks the roots. The fungus destroys the root vascular system, preventing water and nutrient uptake, resulting in stunted, prematurely bleached plants ('whiteheads') that pull up easily.",
    symptoms: [
      "Blackened, dry, brittle roots that break off easily",
      "Shiny coal-black discoloration of the crown and lower stem base",
      "Prematurely bleached white heads (whiteheads) containing no grain",
      "Stunted growth, appearing in patches or taking over entire fields"
    ],
    riskFactors: [
      "Wet, waterlogged soils or poorly drained fields",
      "Alkaline soils (pH > 7.0) and low soil fertility (especially Nitrogen/K)",
      "Continuous wheat cropping systems without rotation",
      "Mild, wet winter followed by a dry spring"
    ],
    treatment: {
      immediate: "Foliar fungicides are completely ineffective. Improve soil nitrogen levels to help plants grow adventitious roots.",
      chemical: "Apply specialized seed treatments: Fluquinconazole or Silthiofam (Latitude) before sowing in high-risk paddocks.",
      organic: "Apply beneficial soil bacteria (Pseudomonas fluorescens) as a seed dip. Maintain balanced phosphorus and potassium levels.",
      preventive: "Rotate with broadleaf crops (canola, field peas) for at least 1-2 years. Improve soil drainage and control grass weeds."
    }
  }
];

export const SYMPTOMS_BY_ANATOMY: Record<string, { id: string; text: string }[]> = {
  head: [
    { id: "bleached_spikelets", text: "Premature bleaching of individual spikelets or whole head" },
    { id: "pink_spores", text: "Pink or light orange powdery spore masses at spikelet bases" },
    { id: "black_spores_dust", text: "Grains replaced by olive-black, dry, dusty spore masses" },
    { id: "shriveled_grains", text: "Shriveled, chalky-white, or pink-tinted wheat kernels" },
    { id: "stripe_glumes", text: "Yellow-orange pustules arranged in stripes on the head glumes" }
  ],
  leaves: [
    { id: "orange_pustules_round", text: "Small, round orange-brown pustules scattered randomly" },
    { id: "yellow_pustules_stripes", text: "Bright yellow-orange pustules arranged in linear stripes" },
    { id: "white_fluffy_patches", text: "Fluffy, cotton-like white or light gray patches on leaves" },
    { id: "lens_lesions_spots", text: "Tan, rectangular, lens-shaped spots with tiny black dots inside" },
    { id: "yellow_halos_chlorosis", text: "Yellow halos or rings surrounding spots or pustules" },
    { id: "leaf_drying_necrosis", text: "Premature drying and death of the leaf tissue" }
  ],
  stem: [
    { id: "red_pustules_elongated", text: "Large, elongated reddish-brown pustules bursting through tissue" },
    { id: "black_pustules_fall", text: "Pustules turning dark black late in the season" },
    { id: "stem_black_base", text: "Shiny coal-black discoloration at the very base of the stem" },
    { id: "weakened_stems_lodging", text: "Lodging (stems falling over in high wind/rain)" },
    { id: "white_mycelium_stem", text: "White cottony patches wrapping around stem segments" }
  ],
  roots: [
    { id: "black_rotted_roots", text: "Brittle, blackened roots that crumble easily" },
    { id: "whiteheads_no_grain", text: "Bleached, dry plants with empty heads that pull up easily" },
    { id: "stunted_patchy_growth", text: "Stunted yellowing plants growing in localized patches" }
  ]
};
