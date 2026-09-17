import { Business, FragmentSet } from "../types";

/**
 * Replaces placeholders in a template fragment with real business data.
 */
function interpolate(template: string, business: Business): string {
  if (!template) return "";
  return template
    .replace(/\[BusinessName\]/g, business.name)
    .replace(/\[Area\]/g, business.area || "")
    .replace(/\[City\]/g, business.city || "")
    .replace(/\[ContactName\]/g, business.contact_name || "the team");
}

/**
 * Sentence connectors injected between middle fragments for natural flow.
 */
const CONNECTORS = [
  "Also, ",
  "On top of that, ",
  "What really stood out — ",
  "Worth mentioning: ",
  "Another thing I loved — ",
  "Plus, ",
  "I also noticed ",
  "",  // sometimes no connector for variety
  "",
];

function randomConnector(): string {
  return CONNECTORS[Math.floor(Math.random() * CONNECTORS.length)];
}

/**
 * Generates a unique, natural-sounding review using combinatorial selections.
 * Optimized for Google Local SEO signals: business name, geo-keywords, service terms.
 * Target length: 120–280 characters for optimal engagement and ranking.
 */
export function generateReview(business: Business, fragmentSet: FragmentSet, excludeReviews: string[] = []): string {
  const { openings, services, locations, experiences, staff_mentions, endings } = fragmentSet;

  // Safe checks
  const safeOpenings = openings && openings.length > 0 ? openings : ["Great experience at [BusinessName] in [City]!"];
  const safeServices = services && services.length > 0 ? services : ["They did an outstanding job."];
  const safeLocations = locations && locations.length > 0 ? locations : ["The location in [Area] is very clean and convenient."];
  const safeExperiences = experiences && experiences.length > 0 ? experiences : ["Very happy with everything."];
  const safeStaff = staff_mentions && staff_mentions.length > 0 ? staff_mentions : ["The staff was genuinely helpful."];
  const safeEndings = endings && endings.length > 0 ? endings : ["Highly recommended for anyone in [City]!"];

  // To keep it natural and within bounds, we dynamically build a review:
  // - Opening (always)
  // - Ending (always)
  // - 1 or 2 of the middle parts (Services, Locations, Experiences, Staff)
  
  // Create a pool of previous generated reviews to avoid repeating within the same session
  let usedReviews: string[] = [];
  try {
    const sessionData = sessionStorage.getItem(`used_reviews_${business.slug}`);
    if (sessionData) {
      usedReviews = JSON.parse(sessionData);
    }
  } catch (e) {
    console.error("Session storage error", e);
  }

  let finalReview = "";
  let lastValidButUsedReview = "";
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const op = safeOpenings[Math.floor(Math.random() * safeOpenings.length)];
    const ed = safeEndings[Math.floor(Math.random() * safeEndings.length)];
    
    // Choose middle elements randomly to ensure variety and stay within size limits
    const midPool = [
      { type: 'service', val: safeServices[Math.floor(Math.random() * safeServices.length)] },
      { type: 'location', val: safeLocations[Math.floor(Math.random() * safeLocations.length)] },
      { type: 'experience', val: safeExperiences[Math.floor(Math.random() * safeExperiences.length)] },
      { type: 'staff', val: safeStaff[Math.floor(Math.random() * safeStaff.length)] }
    ];

    // Shuffle midPool
    midPool.sort(() => Math.random() - 0.5);
    
    // 50% chance of 2 middle parts for richer, more detailed reviews
    const numMid = Math.random() > 0.5 ? 1 : 2;
    
    let selectedMids: string;
    if (numMid === 2) {
      // Join two middle fragments with a natural connector
      selectedMids = midPool[0].val + " " + randomConnector() + midPool[1].val.charAt(0).toLowerCase() + midPool[1].val.slice(1);
    } else {
      selectedMids = midPool[0].val;
    }

    // Combine them
    const combined = `${op} ${selectedMids} ${ed}`;
    const interpolated = interpolate(combined, business)
      // Clean up any double spaces or spacing glitches
      .replace(/\s+/g, " ")
      .trim();

    // Check constraints: length <= 280, and not recently used
    if (interpolated.length <= 280) {
      if (!usedReviews.includes(interpolated) && !excludeReviews.includes(interpolated)) {
        finalReview = interpolated;
        break; // found a completely fresh one!
      } else {
        lastValidButUsedReview = interpolated;
      }
    }
    attempts++;
  }

  // Fallback if we couldn't find a unique one within length constraints after many attempts
  if (!finalReview) {
    if (lastValidButUsedReview) {
      finalReview = lastValidButUsedReview;
    } else {
      const op = safeOpenings[Math.floor(Math.random() * safeOpenings.length)];
      const ed = safeEndings[Math.floor(Math.random() * safeEndings.length)];
      // Pick any middle category randomly
      const midCats = [safeServices, safeLocations, safeExperiences, safeStaff];
      const chosenCat = midCats[Math.floor(Math.random() * midCats.length)];
      const mid = chosenCat[Math.floor(Math.random() * chosenCat.length)];
      
      finalReview = interpolate(`${op} ${mid} ${ed}`, business).replace(/\s+/g, " ").trim();
    }
  }

  // Update session storage
  try {
    usedReviews.push(finalReview);
    if (usedReviews.length > 30) {
      usedReviews.shift(); // keep it bounded
    }
    sessionStorage.setItem(`used_reviews_${business.slug}`, JSON.stringify(usedReviews));
  } catch (e) {
    // ignore
  }

  return finalReview;
}

/**
 * Generates initial fragment sets for a category with interpolation tokens.
 * Designed for maximum Google Local SEO impact through:
 * - Business name embedding
 * - City + Area geo-signals
 * - Category-specific service keywords
 * - Natural sentence variety (questions, comparisons, time-refs)
 * - Recommendation language
 */
export function getStarterFragments(
  category: string, 
  name: string, 
  contactName: string, 
  area: string, 
  city: string, 
  selectedPraiseTexts: string[]
): Omit<FragmentSet, 'id' | 'business_id' | 'owner_id'> {
  
  // ─── OPENINGS (12) ─── Varied styles: narrative, question, comparison, time-ref
  const commonOpenings = [
    "Had a wonderful experience at [BusinessName] in [Area], [City]!",
    "If you're looking for quality service in [City], [BusinessName] is the place.",
    "Visited [BusinessName] last week and I'm really impressed.",
    "I've tried a few places in [Area] but [BusinessName] is on another level.",
    "Can't say enough good things about [BusinessName] in [City].",
    "First time at [BusinessName] and it definitely won't be my last.",
    "A friend recommended [BusinessName] in [Area] and I'm so glad I went.",
    "Been coming to [BusinessName] for months now and they consistently deliver.",
    "Just had my appointment at [BusinessName] and everything went perfectly.",
    "Hands down the best experience I've had at any place in [City].",
    "[BusinessName] in [Area] really sets the standard for quality.",
    "So happy I discovered [BusinessName] — they're genuinely great at what they do.",
  ];

  // ─── LOCATIONS (8) ─── Geo-rich with [Area]/[City] for local SEO signals
  const commonLocations = [
    "The space in [Area] is clean, modern, and very well-maintained.",
    "Easy to find in [Area] with great parking options nearby.",
    "The interior is beautifully designed with a warm, welcoming atmosphere.",
    "Conveniently located in [Area], [City] — very accessible from the main road.",
    "The place is spotless and the ambiance makes you feel comfortable right away.",
    "Their [Area] location is well-organized and never feels overcrowded.",
    "Love how well they've set up the space — modern and comfortable.",
    "Great location in [City], easy to get to and the setup inside is impressive.",
  ];

  // ─── STAFF MENTIONS (8) ─── Role-specific, interaction-driven
  const commonStaff = [
    "The entire team was friendly, professional, and made me feel welcome.",
    "[ContactName] and the staff genuinely care about getting things right.",
    "Everyone on the team greeted me warmly and was super attentive.",
    "The front desk staff was helpful and the service team was exceptional.",
    "You can tell [ContactName] runs a tight ship — very well-managed.",
    "The staff took the time to understand exactly what I needed.",
    "Really appreciated how patient and professional the whole team was.",
    "From check-in to checkout, every person I interacted with was fantastic.",
  ];

  // ─── ENDINGS (10) ─── Recommendation, return-intent, social proof
  const commonEndings = [
    "Highly recommend [BusinessName] to anyone in [City]!",
    "Will definitely be back and I'm telling all my friends about this place.",
    "Five stars, well deserved. Don't hesitate to visit [BusinessName].",
    "If you're in [Area], do yourself a favor and check them out.",
    "One of the best local businesses in [City] — truly outstanding.",
    "Already booked my next visit. That's how good they are.",
    "Would give more than five stars if I could. Absolutely worth it.",
    "This is the kind of place [City] needs more of. Exceptional service.",
    "I've already recommended [BusinessName] to my family. You should try them too.",
    "Consistently great experience every single time. Top-notch place in [Area].",
  ];

  // ─── SERVICES (8 per category) ─── Specific service keywords for search ranking
  let services: string[] = [];
  switch (category) {
    case 'dental':
      services = [
        "My teeth cleaning and dental checkup were done thoroughly and painlessly.",
        "Got a teeth whitening session and the results are visibly impressive.",
        "The root canal treatment was handled expertly with virtually no discomfort.",
        "They explained the entire dental procedure clearly before starting.",
        "My cavity filling was quick, precise, and completely pain-free.",
        "The dental X-rays and consultation were done efficiently and professionally.",
        "Had braces adjustment done here and the orthodontic work is excellent.",
        "The scaling and polishing left my teeth feeling incredibly clean and fresh.",
      ];
      break;
    case 'salon':
      services = [
        "My haircut and styling turned out exactly how I wanted — perfectly done.",
        "The hair coloring and balayage work was stunning and long-lasting.",
        "Had a deep conditioning treatment and my hair feels completely transformed.",
        "The facial treatment was deeply relaxing and my skin looks noticeably better.",
        "Got a manicure and pedicure — the nail art was intricate and beautiful.",
        "The head massage and hair spa session was the most relaxing I've ever had.",
        "My bridal makeup trial was flawless and exactly the look I was going for.",
        "The threading and cleanup was quick, gentle, and very precise.",
      ];
      break;
    case 'restaurant':
      services = [
        "The food was cooked to perfection — every dish had incredible flavor.",
        "We tried the biryani and butter chicken and both were absolutely delicious.",
        "The pasta and risotto were restaurant-quality at its finest.",
        "Fresh ingredients in every bite — you can really taste the quality.",
        "The desserts and beverages menu has some truly unique options.",
        "Portion sizes are generous and the presentation is always beautiful.",
        "Their weekend brunch menu is fantastic — great variety and taste.",
        "The chef's special was outstanding and the flavors were perfectly balanced.",
      ];
      break;
    case 'gym':
      services = [
        "The personal training sessions are well-structured and results-driven.",
        "The group fitness classes are high-energy and incredibly motivating.",
        "Got a customized workout plan that fits my schedule and goals perfectly.",
        "The cardio and weight training equipment is top-tier and well-maintained.",
        "Their yoga and stretching sessions are great for recovery and flexibility.",
        "The CrossFit program here pushes you just the right amount.",
        "The gym induction was thorough and the trainers corrected my form on every exercise.",
        "They offer nutritional guidance alongside training which really helps results.",
      ];
      break;
    case 'retail':
      services = [
        "Found exactly what I was looking for and at a very competitive price.",
        "The product selection is impressive — lots of quality brands to choose from.",
        "Their shelves are well-stocked and the store layout makes shopping easy.",
        "Great deals on electronics and accessories — prices beat online stores.",
        "The clothing section has trendy options and the sizes run true.",
        "They carry unique products you won't find at other stores in [City].",
        "The home decor collection is curated beautifully with something for every style.",
        "Checkout was fast and they offered gift wrapping which was a nice touch.",
      ];
      break;
    default:
      services = [
        "The service was handled with speed, precision, and complete professionalism.",
        "They delivered exactly what was promised, on time and within budget.",
        "The quality of work exceeded my expectations in every way.",
        "They were transparent about pricing with no hidden fees or surprise charges.",
        "The consultation was thorough and they answered every question I had.",
        "Got the job done faster than expected and the results are top-quality.",
        "Their attention to detail and craftsmanship is clearly above average.",
        "They followed up after the service to make sure I was fully satisfied.",
      ];
      break;
  }

  // Map selected praise points or default with SEO-optimized experiences
  const experiences = selectedPraiseTexts.length > 0 
    ? selectedPraiseTexts 
    : [
        "The attention to detail and genuine care they put into their work is exceptional.",
        "I was impressed by how efficient and smooth the entire process was.",
        "Everything felt personalized — not like a cookie-cutter experience.",
        "They made me feel valued as a customer from the moment I walked in.",
        "The whole experience was seamless, professional, and stress-free.",
        "You can tell they take pride in what they do — it shows in the results.",
        "I felt completely comfortable and well taken care of throughout.",
        "They went above and beyond what I expected and I'm genuinely grateful.",
      ];

  return {
    openings: commonOpenings,
    services,
    locations: commonLocations,
    experiences,
    staff_mentions: commonStaff,
    endings: commonEndings
  };
}
