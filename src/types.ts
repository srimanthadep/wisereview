export type BusinessCategory = 'dental' | 'salon' | 'restaurant' | 'gym' | 'retail' | 'other';

export interface Business {
  id: string; // This is the slug, used as the Firestore doc ID for rapid direct lookups
  owner_id: string;
  slug: string;
  name: string;
  category: BusinessCategory;
  contact_name: string;
  area: string;
  city: string;
  google_place_id: string;
  plan: 'free' | 'pro';
  created_at: any; // Firestore Timestamp
}

export interface FragmentSet {
  id: string; // matches business slug
  business_id: string; // matches business slug
  owner_id: string;
  openings: string[];
  services: string[];
  locations: string[];
  experiences: string[];
  staff_mentions: string[];
  endings: string[];
}

export interface ScanEvent {
  id?: string;
  business_id: string; // slug
  owner_id: string; // added so owner can secure query them
  scanned_at: any; // Firestore Timestamp
  redirected_to_google: boolean;
  user_agent: string;
}

export interface OnboardingData {
  category: BusinessCategory;
  name: string;
  contact_name: string;
  area: string;
  city: string;
  google_place_id: string;
  praisePoints: string[];
}

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  dental: 'Dental Clinic',
  salon: 'Salon & Spa',
  restaurant: 'Restaurant & Café',
  gym: 'Gym & Fitness',
  retail: 'Retail Store',
  other: 'Other Business'
};

export const PRAISE_OPTIONS: Record<BusinessCategory, { label: string; text: string }[]> = {
  dental: [
    { label: "Gentle Care", text: "The gentle care and dental precision they showed made me feel completely at ease during treatment." },
    { label: "No Wait Times", text: "I was seated for my dental appointment immediately with virtually no waiting time at all." },
    { label: "Clear Explanations", text: "They explained the dental procedure step by step and answered all my questions thoroughly." },
    { label: "Modern Equipment", text: "The clinic uses state-of-the-art dental technology that makes every visit faster and more comfortable." },
    { label: "Spotless Clinic", text: "The clinical rooms and hygiene standards were absolutely spotless — you can tell they take sterilization seriously." },
    { label: "Painless Treatment", text: "I barely felt anything during my dental filling — their pain management approach is excellent." },
    { label: "Great for Kids", text: "They're wonderful with children — my kids actually look forward to their dental checkups now." },
    { label: "Affordable Pricing", text: "The pricing for dental work here is very fair and transparent with no hidden charges." },
  ],
  salon: [
    { label: "Attentive Styling", text: "The stylist listened closely to exactly what I wanted for my haircut and executed it perfectly." },
    { label: "Luxurious Atmosphere", text: "The salon atmosphere is incredibly calming, beautifully decorated, and feels truly premium." },
    { label: "Premium Products", text: "They use high-quality, professional-grade products that left my hair and skin feeling incredible." },
    { label: "Relaxing Experience", text: "The entire salon visit was peaceful, soothing, and relaxing from start to finish." },
    { label: "Perfect Results", text: "I walked out feeling completely pampered and extremely happy with my new hairstyle." },
    { label: "Expert Coloring", text: "The hair coloring work was flawless — the shades blended perfectly and the color lasted weeks." },
    { label: "Bridal Specialists", text: "Their bridal makeup and styling services are top-notch — I looked exactly how I dreamed." },
    { label: "Skilled Nail Art", text: "The nail art and manicure were done with incredible precision and creative detail." },
  ],
  restaurant: [
    { label: "Quick Service", text: "The kitchen was impressively fast and our server was attentive without being intrusive." },
    { label: "Fresh Ingredients", text: "You can taste the freshness and quality of the ingredients in every single dish they serve." },
    { label: "Beautiful Plating", text: "Every plate was served with beautiful presentation — the food looks as good as it tastes." },
    { label: "Cozy Ambiance", text: "The seating and ambiance are warm, cozy, and perfect for dining with family or friends." },
    { label: "Great Recommendations", text: "The staff recommended some amazing dishes and pairings that turned out to be absolutely delicious." },
    { label: "Diverse Menu", text: "The menu has incredible variety — there's something delicious for every taste and dietary preference." },
    { label: "Outstanding Desserts", text: "Their desserts are a must-try — creative flavors and perfectly portioned for sharing." },
    { label: "Value for Money", text: "The portion sizes are generous and the pricing is very reasonable for the quality you get." },
  ],
  gym: [
    { label: "Expert Trainers", text: "The personal trainers here are true experts who correct your form and push you to improve." },
    { label: "Great Equipment", text: "They have a wide selection of modern, well-maintained workout equipment for every muscle group." },
    { label: "Spotless Facility", text: "The gym floor and locker rooms are sanitized regularly and always kept spotless." },
    { label: "Energetic Vibe", text: "The atmosphere is loaded with motivating music and high-energy vibes that push you harder." },
    { label: "Supportive Community", text: "The community of members is welcoming, supportive, and genuinely encouraging." },
    { label: "Flexible Timings", text: "Their operating hours are very flexible which makes it easy to fit workouts into a busy schedule." },
    { label: "Results-Driven", text: "The customized fitness plans they design actually deliver visible results within weeks." },
    { label: "Great Group Classes", text: "The group fitness classes like yoga, HIIT, and CrossFit are well-structured and super engaging." },
  ],
  retail: [
    { label: "Helpful Staff", text: "The staff went out of their way to help me find exactly what I was looking for in the store." },
    { label: "Great Pricing", text: "Their pricing is very competitive and offers excellent value for the product quality." },
    { label: "Organized Layout", text: "The store is beautifully organized and the layout makes it incredibly easy to browse and shop." },
    { label: "Quick Checkout", text: "The checkout process was fast and efficient — no long lines or unnecessary delays." },
    { label: "Wide Selection", text: "They carry an impressive range of products and brands that you won't easily find elsewhere." },
    { label: "Quality Products", text: "Every product I've purchased here has been high quality and exactly as described." },
    { label: "Easy Returns", text: "Their return and exchange policy is hassle-free which gives me confidence to shop here." },
    { label: "Regular Deals", text: "They frequently have sales and promotions that make shopping here even more worthwhile." },
  ],
  other: [
    { label: "Fast Response", text: "They responded to my inquiry within minutes and got me scheduled without any delays." },
    { label: "Honest Advice", text: "I really appreciated their transparent, honest advice without any high-pressure sales tactics." },
    { label: "Fair Pricing", text: "The quote was clear, fair, and came with no hidden fees or surprise charges." },
    { label: "Great Communication", text: "They kept me informed throughout the entire process and were always easy to reach." },
    { label: "Reliable Service", text: "They showed up exactly on time and delivered high-quality work as promised." },
    { label: "Professional Team", text: "Every person I dealt with was courteous, skilled, and clearly experienced in their field." },
    { label: "Clean Workspace", text: "They left the workspace spotless after finishing — very respectful and professional." },
    { label: "Follow-Up Care", text: "They followed up after the job was done to make sure I was completely satisfied." },
  ]
};

