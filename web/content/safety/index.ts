export interface SafetyResource {
  label: string;
  href: string;
  note?: string;
}

export interface SafetyTipSection {
  title: string;
  tips: string[];
}

export interface SafetyGuide {
  slug: string;
  /** Display name shown on cards and pages */
  label: string;
  summary: string;
  /** Flat tip list used on area cards / legacy consumers */
  tips: string[];
  /** Optional grouped tips for the full guide page */
  tipSections?: SafetyTipSection[];
  resources: SafetyResource[];
}

/** Shared NZ community organisations — shown on area briefs and every guide page. */
export const COMMUNITY_ORGANISATIONS: SafetyResource[] = [
  {
    label: "Neighbourhood Support New Zealand",
    href: "https://www.neighbourhoodsupport.co.nz",
    note: "Join or start a local group · 0800 4 NEIGHBOURS (0800 463 444)",
  },
  {
    label: "Neighbourhood Support — tips and advice",
    href: "https://www.neighbourhoodsupport.co.nz/tips-advice",
    note: "Home, vehicle, rural, fraud, and community safety guides",
  },
  {
    label: "Community Patrols of New Zealand (CPNZ)",
    href: "https://cpnz.org.nz",
    note: "Volunteer patrollers — trained eyes and ears for Police · 04 817 0228",
  },
  {
    label: "Community Cam",
    href: "https://communitycam.co.nz/index.cfm",
    note: "Register CCTV so Police can contact you after nearby crime (not-for-profit)",
  },
  {
    label: "NZ Police — keeping safe",
    href: "https://www.police.govt.nz/advice/personal-community/keeping-safe",
    note: "Home, out and about, and property advice",
  },
  {
    label: "Crimestoppers",
    href: "https://www.crimestoppers-nz.org",
    note: "0800 555 111 — report crime anonymously",
  },
];

export const SAFETY_GUIDES: Record<string, SafetyGuide> = {
  theft: {
    slug: "theft",
    label: "Theft",
    summary:
      "Most theft is opportunistic. Keep valuables out of sight, lock vehicles, and stay aware in busy places — small habits close the easy opportunities.",
    tips: [
      "Keep bags and valuables close to your body in busy areas. Never leave items unattended on café tables, beach towels, or shop counters.",
      "Always lock vehicles — even for short stops. Remove bags, phones, and tools from sight or take them with you.",
      "Shield your PIN at ATMs and EFTPOS. If a machine looks tampered with, use another one and tell the bank or shop.",
      "Separate house and car keys; avoid address labels on keyrings. Photograph valuables and record serial numbers.",
      "Mark tools and bikes with a unique ID. Report theft via 105.police.govt.nz — patterns help Police and Community Patrols.",
    ],
    tipSections: [
      {
        title: "When you are out",
        tips: [
          "Keep bags zipped and in front of you in crowded places, markets, and on public transport.",
          "Do not leave phones, wallets, or headphones on tables while you queue or visit the bathroom.",
          "Be wary of distraction thefts — someone bumping you or asking for directions while an accomplice takes your bag.",
          "Plan a well-lit route home. Stick to busy streets when carrying valuables.",
        ],
      },
      {
        title: "Vehicles, bikes, and tools",
        tips: [
          "Lock cars, vans, motorbikes, and trailers every time. Use a steering lock, alarm, or quality bike chain as an extra deterrent.",
          "Park in well-lit, busy places. Prefer a garage or off-street parking when you can.",
          "Never leave laptops, tools, or shopping bags visible — even under a coat on the seat.",
          "Register bikes and record frame numbers. Secure trailers and ride-ons with locks or a hitch lock.",
        ],
      },
      {
        title: "At home and online",
        tips: [
          "Keep spare keys inside — not under a mat or pot plant.",
          "Photograph jewellery, electronics, and tools; keep serial numbers somewhere safe (not only on the device).",
          "Check bank and card statements for unfamiliar transactions and report them quickly.",
          "Be alert to scams and fake courier or bank messages — Neighbourhood Support has fraud-prevention tips.",
        ],
      },
    ],
    resources: [
      {
        label: "Neighbourhood Support — tips and advice",
        href: "https://www.neighbourhoodsupport.co.nz/tips-advice",
        note: "Vehicle safety, belongings, and scam prevention",
      },
      {
        label: "NZ Police — protect your property",
        href: "https://www.police.govt.nz/advice/personal-community/protect-property-vehicles",
      },
      {
        label: "NZ Police — keep safe when out and about",
        href: "https://www.police.govt.nz/advice/personal-community/keeping-safe/out-about",
      },
      {
        label: "Community Cam — register CCTV",
        href: "https://communitycam.co.nz/index.cfm",
        note: "Help Police find nearby cameras after thefts",
      },
      {
        label: "Community Patrols of New Zealand",
        href: "https://cpnz.org.nz",
        note: "Volunteer patrols that report suspicious activity",
      },
      {
        label: "Victim Support — keeping safe",
        href: "https://www.victimsupport.org.nz/practical-information/keeping-safe",
        note: "0800 842 846",
      },
      {
        label: "Crimestoppers",
        href: "https://www.crimestoppers-nz.org",
        note: "0800 555 111 — anonymous",
      },
    ],
  },
  burglary: {
    slug: "burglary",
    label: "Burglary",
    summary:
      "Burglars look for easy access and quiet properties — often in daytime. Focus on locks, lights, and clear lines of sight, and stay connected with neighbours.",
    tips: [
      "Lock doors and windows whenever you leave — including quick trips to the garden or garage. Most burglaries happen when people are out (often mid-morning to mid-afternoon).",
      "Use the Neighbourhood Support checklist: secure locks, good lighting at entrances, and clear sightlines with trimmed shrubs.",
      "Keep valuables out of sight from windows and doors. Secure sheds and garages with quality locks.",
      "When away: hold mail, use light timers, and ask a trusted neighbour to check the property so it looks lived-in.",
      "Get to know your neighbours or join Neighbourhood Support — connected streets are harder targets.",
    ],
    tipSections: [
      {
        title: "Locks, lights, and lines of sight",
        tips: [
          "Fit secure locks and fastenings on doors and windows; use security stays on ground-floor windows.",
          "Shut and lock every window and door when you go out — including ranch-sliders and bathroom windows.",
          "Lock sheds and garages. Put ladders and tools away so they cannot be used to reach upper windows.",
          "Light entranceways well; use sensor lights and leave them on.",
          "Trim trees and hedges so people can see who is coming and going. Keep fences and gates secure.",
          "Do not hide spare keys outside. Keep them in a safe place inside.",
        ],
      },
      {
        title: "When you are away or out the back",
        tips: [
          "Burglars may enter while you are in the garden or garage — lock the front door even then.",
          "Put mail and deliveries on hold, or ask a neighbour to collect them so they do not pile up.",
          "Use timers for lights (and a radio if useful) so the house looks occupied at night.",
          "Tell a trusted neighbour you will be away. Ask them to park in the drive or open/close curtains if they can.",
          "If you have an alarm, tell the monitoring company you are away.",
        ],
      },
      {
        title: "Design and neighbourhood (CPTED)",
        tips: [
          "Crime Prevention Through Environmental Design (CPTED): maximise visibility, manage access, show clear ownership of your property, and keep the place tidy and cared-for.",
          "Make private vs public space obvious with fencing, planting, or markers so strangers feel conspicuous cutting through.",
          "Clear litter and graffiti quickly — neglected spaces can invite more crime.",
          "Join or start a Neighbourhood Support group, or ask about Community Patrols in your area.",
          "If you have CCTV, register it with Community Cam so Police can contact you after nearby crime without door-knocking every house.",
        ],
      },
      {
        title: "If a burglary happens",
        tips: [
          "Call 111 if a crime is happening or someone may still be on the property.",
          "If it has already happened, report via 105 or 105.police.govt.nz — do not disturb the scene if you can avoid it.",
          "List what was taken with serial numbers and photos for Police and insurance.",
          "Victim Support can help with the emotional and practical aftermath — 0800 842 846.",
        ],
      },
    ],
    resources: [
      {
        label: "Neighbourhood Support — protecting your home",
        href: "https://www.neighbourhoodsupport.co.nz/protecting-your-home",
        note: "Locks, lights, lines of sight checklist",
      },
      {
        label: "Neighbourhood Support — CPTED guide",
        href: "https://www.neighbourhoodsupport.co.nz/crime-prevention-through-environmental-design",
        note: "Design your property and street to reduce opportunity",
      },
      {
        label: "Neighbourhood Support — tips and advice hub",
        href: "https://www.neighbourhoodsupport.co.nz/tips-advice",
      },
      {
        label: "Join Neighbourhood Support",
        href: "https://www.neighbourhoodsupport.co.nz",
        note: "0800 4 NEIGHBOURS (0800 463 444)",
      },
      {
        label: "Community Cam — register your CCTV",
        href: "https://communitycam.co.nz/index.cfm",
        note: "Confidential register used by NZ Police",
      },
      {
        label: "Community Cam — how it works",
        href: "https://communitycam.co.nz/how-it-works.cfm",
      },
      {
        label: "Community Patrols of New Zealand",
        href: "https://cpnz.org.nz",
        note: "Volunteer patrols working with Police",
      },
      {
        label: "NZ Police — keeping yourself safe at home",
        href: "https://www.police.govt.nz/advice/personal-community/keeping-safe/home-safe",
      },
      {
        label: "NZ Police — home safety checklist",
        href: "https://webforms.police.govt.nz/en/home-safety-checklist",
        note: "Free personalised tips by email",
      },
      {
        label: "NZ Police — rural crime prevention",
        href: "https://www.police.govt.nz/advice-services/personal-community-safety/rural-hub/rural-crime-prevention",
        note: "If you live rurally",
      },
    ],
  },
  assault: {
    slug: "assault",
    label: "Assault",
    summary:
      "Plan ahead for nights out, stay with people you trust, and move toward busy, well-lit places if you feel unsafe. Community Patrols and neighbours also help keep streets watched.",
    tips: [
      "Plan how you will get home before you go out. Keep your phone charged and have a transport option ready.",
      "Stay with friends, agree a meeting point if separated, and look out for each other.",
      "Stick to well-lit, busy streets. Trust your instincts and leave situations that feel wrong.",
      "If threatened, move toward people and lights. Call 111 in an emergency.",
      "Reasonable self-defence is allowed, but avoiding confrontation is usually safest — report incidents to Police.",
    ],
    tipSections: [
      {
        title: "Going out",
        tips: [
          "Tell someone where you are going and when you expect to be home.",
          "Arrange a shared taxi, rideshare, or designated driver before drinking.",
          "Keep an eye on drinks; do not leave them unattended.",
          "Stay in groups when possible. Check that friends get home safely.",
        ],
      },
      {
        title: "On the street",
        tips: [
          "Prefer busy, well-lit routes. Cross the road or enter a shop if you feel followed.",
          "Keep headphones low enough to hear what is around you.",
          "Have keys ready before you reach your door so you are not searching in the dark.",
          "Community Patrol volunteers act as extra eyes and ears for Police — report suspicious behaviour via 105 when it is not an emergency.",
        ],
      },
      {
        title: "After an incident",
        tips: [
          "Your safety comes first — get to a safe place, then call 111 if needed.",
          "Victim Support (0800 842 846) and 1737 can help with emotional support.",
          "You can report non-emergency assaults via 105.police.govt.nz.",
          "Knowing neighbours through Neighbourhood Support can mean someone notices if you need help.",
        ],
      },
    ],
    resources: [
      {
        label: "NZ Police — alcohol and staying safe when going out",
        href: "https://www.police.govt.nz/advice/drugs-and-alcohol/alcohol-stay-safe-when-going-out",
      },
      {
        label: "NZ Police — keep safe when out and about",
        href: "https://www.police.govt.nz/advice/personal-community/keeping-safe/out-about",
      },
      {
        label: "Community Patrols of New Zealand",
        href: "https://cpnz.org.nz",
        note: "Find or join a local patrol · 04 817 0228",
      },
      {
        label: "Neighbourhood Support New Zealand",
        href: "https://www.neighbourhoodsupport.co.nz",
        note: "Connected neighbours look out for each other",
      },
      {
        label: "Victim Support — keeping safe",
        href: "https://www.victimsupport.org.nz/practical-information/keeping-safe",
        note: "0800 842 846",
      },
      {
        label: "1737 — Need to talk?",
        href: "https://www.1737.org.nz",
        note: "Free call or text 1737",
      },
    ],
  },
  robbery: {
    slug: "robbery",
    label: "Robbery",
    summary:
      "Stay aware at ATMs and when carrying valuables. If confronted, your safety matters more than property — comply, get to safety, then report.",
    tips: [
      "Be alert at ATMs and when carrying cash or valuables. Park in well-lit areas and keep car doors locked while driving in town.",
      "Shield your PIN. Never accept help from strangers if a card is retained by a machine — contact your bank.",
      "If confronted, comply with demands, avoid sudden moves, and try to remember details for Police later.",
      "Get to a safe place with other people, then call 111. Use 105.police.govt.nz when it is not an emergency.",
      "Do not chase offenders. Property can be replaced — lives cannot.",
    ],
    tipSections: [
      {
        title: "Reduce the risk",
        tips: [
          "Use ATMs inside banks or busy, well-lit places — preferably during the day.",
          "Put cash and phones away before leaving a shop or machine.",
          "Vary routines if you regularly carry cash for work; tell someone your plans.",
          "Keep vehicle doors locked and windows up in slow traffic or when stopped.",
        ],
      },
      {
        title: "If you are confronted",
        tips: [
          "Hand over what is demanded. Do not resist for property.",
          "Avoid sudden movements that could escalate the situation.",
          "Note clothing, height, accents, direction of travel, and vehicle details if it is safe to do so.",
          "Go somewhere public and call 111. Seek medical help if you are hurt.",
        ],
      },
      {
        title: "Helping your community",
        tips: [
          "Report robberies and near-misses — even unsuccessful ones help Police see patterns.",
          "Register street or business CCTV with Community Cam so Police can find cameras quickly.",
          "Community Patrols and Neighbourhood Support strengthen local eyes and ears.",
          "Crimestoppers (0800 555 111) takes anonymous tips.",
        ],
      },
    ],
    resources: [
      {
        label: "NZ Police — keep safe when out and about",
        href: "https://www.police.govt.nz/advice/personal-community/keeping-safe/out-about",
      },
      {
        label: "NZ Police — protect your property",
        href: "https://www.police.govt.nz/advice/personal-community/protect-property-vehicles",
      },
      {
        label: "Community Cam",
        href: "https://communitycam.co.nz/index.cfm",
        note: "Register CCTV to support investigations",
      },
      {
        label: "Community Patrols of New Zealand",
        href: "https://cpnz.org.nz",
      },
      {
        label: "Neighbourhood Support New Zealand",
        href: "https://www.neighbourhoodsupport.co.nz",
      },
      {
        label: "Victim Support",
        href: "https://www.victimsupport.org.nz",
        note: "0800 842 846",
      },
      {
        label: "Crimestoppers",
        href: "https://www.crimestoppers-nz.org",
        note: "0800 555 111 — anonymous",
      },
    ],
  },
  sexual: {
    slug: "sexual",
    label: "Sexual harm",
    summary:
      "Support is available whether or not you report to Police. You can talk through your options confidentially — it is never the victim’s fault.",
    tips: [
      "If you are in immediate danger, call 111.",
      "You do not have to make a formal complaint to get help. Police can explain options and connect you with specialist support.",
      "On nights out: stay with friends, plan transport home, and do not leave drinks unattended.",
      "Sexual harm is never the victim’s fault. Reporting can happen days, weeks, or years after an incident.",
      "Safe, confidential helplines are available 24/7 — you do not need to go through Police first.",
    ],
    tipSections: [
      {
        title: "If you need help now",
        tips: [
          "Call 111 if you are in danger or need urgent medical help.",
          "Safe to talk (0800 044 334 / text 4334) is a free sexual harm helpline — confidential and available whether or not you report to Police.",
          "You can also contact Victim Support (0800 842 846) or TOAH-NNEST for local specialist services.",
        ],
      },
      {
        title: "Staying safer socially",
        tips: [
          "Stay with people you trust; check in when plans change.",
          "Plan how you will get home before you go out.",
          "Do not leave drinks unattended; be cautious accepting drinks from strangers.",
          "Look out for friends who may be vulnerable or separated from the group.",
        ],
      },
      {
        title: "Reporting and options",
        tips: [
          "You control whether and when to make a formal complaint.",
          "Police pages explain what happens if you report a sexual assault and what support is available.",
          "Medical care and forensic options can be discussed with specialist services even if you are unsure about reporting.",
          "Friends and family can also seek advice on how to support someone.",
        ],
      },
    ],
    resources: [
      {
        label: "Safe to talk — sexual harm helpline",
        href: "https://www.safetotalk.nz",
        note: "0800 044 334 · text 4334",
      },
      {
        label: "NZ Police — advice for victims of sexual assault",
        href: "https://www.police.govt.nz/advice-services/advice-victims/victims-rape-or-sexual-assault",
      },
      {
        label: "NZ Police — sexual assault and consent",
        href: "https://www.police.govt.nz/advice-services/sexual-assault-and-consent/what-can-i-do-if-i-have-been-sexually-assaulted",
      },
      {
        label: "TOAH-NNEST — find local support",
        href: "https://toah-nnest.org.nz",
        note: "National network ending sexual violence",
      },
      {
        label: "Victim Support",
        href: "https://www.victimsupport.org.nz",
        note: "0800 842 846",
      },
      {
        label: "1737 — Need to talk?",
        href: "https://www.1737.org.nz",
        note: "Free call or text 1737",
      },
    ],
  },
};

export const SAFETY_GUIDE_SLUGS = Object.keys(SAFETY_GUIDES);

/** @deprecated Use SAFETY_GUIDES instead */
export const CRIME_TIPS: Record<string, string[]> = Object.fromEntries(
  Object.entries(SAFETY_GUIDES).map(([key, guide]) => [key, guide.tips]),
);

export function getSafetyGuide(slug: string): SafetyGuide | undefined {
  return SAFETY_GUIDES[slug.toLowerCase()];
}

export function guideLabelForCrimeType(crimeType: string): string {
  const key = crimeType.toLowerCase();
  return SAFETY_GUIDES[key]?.label ?? crimeType;
}
