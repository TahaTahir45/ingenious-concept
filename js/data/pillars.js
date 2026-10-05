/**
 * Single source of truth for the five service pillars.
 * Tabs, the 3D service prism, the hero rays and the contact form
 * all render from this array, so editing copy happens in one place.
 * `color` refers to a CSS custom property defined in css/tokens.css.
 */

const icon = (paths) =>
  `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const pillars = [
  {
    id: "ai",
    color: "--c-ai",
    short: "AI & digital",
    title: "AI & Digital Solutions",
    summary:
      "Software that does real work: agents that run your workflows, apps your customers open every day, and the integrations that hold it all together.",
    icon: icon(
      '<path d="M24 6v8M24 34v8M6 24h8M34 24h8"/><path d="M24 14c1.5 6 4 8.5 10 10-6 1.5-8.5 4-10 10-1.5-6-4-8.5-10-10 6-1.5 8.5-4 10-10z"/>'
    ),
    deliverables: [
      {
        title: "Custom AI Agents & Workflow Automation",
        body: "Agents that read documents, answer customers, update your CRM and hand off to a person when it matters. Built on your own data, with guardrails and logs you can audit.",
        chips: ["LLM agents", "Search over your documents", "n8n and Make workflows", "Human review steps"],
      },
      {
        title: "Full-Stack Web & Mobile App Development",
        body: "A product team that takes an app from wireframe to the app stores: design, front end, back end, and the release pipeline that keeps shipping after launch.",
        chips: ["React and Next.js", "Flutter", "Node and Python APIs", "CI/CD"],
      },
      {
        title: "Generative Engine Optimization (GEO for AI Answer Engines)",
        body: "Make your brand the answer when people ask ChatGPT, Gemini or Perplexity. We structure your content, schema and citations so answer engines can find and quote you.",
        chips: ["AI visibility audit", "Schema and entity markup", "Citation building", "Answer tracking"],
      },
      {
        title: "Enterprise Cloud & API Integrations",
        body: "Connect your ERP, CRM, payments and data warehouse so information moves without copy and paste. Hosted on AWS, Azure or Google Cloud, monitored from day one.",
        chips: ["AWS, Azure, GCP", "REST and GraphQL", "ERP and CRM sync", "Monitoring"],
      },
    ],
  },
  {
    id: "growth",
    color: "--c-growth",
    short: "Growth marketing",
    title: "Growth & Full-Scale Digital Marketing",
    summary:
      "Paid, organic and outbound growth run as one system, and measured against revenue rather than reach.",
    icon: icon('<path d="M8 38l11-11 7 7 14-16"/><path d="M30 18h10v10"/>'),
    deliverables: [
      {
        title: "Performance Media & Paid Acquisition",
        body: "Campaigns across Meta, Google, TikTok and LinkedIn, planned from one budget and judged on cost per customer, not cost per click.",
        chips: ["Meta", "Google", "TikTok", "LinkedIn", "Server-side tracking"],
      },
      {
        title: "Technical SEO & Content Architecture",
        body: "We fix crawl, speed and indexing problems first, then build topic clusters around what your buyers actually search for.",
        chips: ["Site audits", "Core Web Vitals", "Topic clusters", "Content briefs"],
      },
      {
        title: "Social Media Management & Creative Production",
        body: "Calendars, shoots, short-form video and community replies, all produced in-house so the creative keeps pace with the posting schedule.",
        chips: ["Content calendars", "Reels and Shorts", "Product shoots", "Community management"],
      },
      {
        title: "Conversion Rate Optimization (CRO) & Funnel Design",
        body: "Find the steps where visitors drop off, redesign them, and test the changes until the numbers move.",
        chips: ["Funnel analytics", "Landing pages", "A/B testing", "Heatmaps"],
      },
      {
        title: "B2B Outbound Infrastructure & Lead Generation",
        body: "Sending domains, warmed inboxes, enriched lists and sequences that put qualified meetings on your sales team's calendar.",
        chips: ["Email infrastructure", "List enrichment", "Sequences", "LinkedIn outreach"],
      },
    ],
  },
  {
    id: "ground",
    color: "--c-ground",
    short: "On-ground",
    title: "On-Ground & Experiential Marketing",
    summary:
      "Physical moments people remember and share: activations, launches and installations that feed straight back into your digital funnel.",
    icon: icon(
      '<path d="M24 42s13-11.5 13-22a13 13 0 0 0-26 0c0 10.5 13 22 13 22z"/><circle cx="24" cy="20" r="5"/>'
    ),
    deliverables: [
      {
        title: "BTL Brand Activations & Interactive Pop-Ups",
        body: "Mall, campus and retail activations, designed and staffed to collect leads rather than just footfall.",
        chips: ["Concept and design", "Fabrication", "Brand ambassadors", "Lead capture"],
      },
      {
        title: "Corporate Events, Expos & Tech Launch Staging",
        body: "Launches and expo stands planned end to end: venue, stage, AV, run-of-show and the live stream.",
        chips: ["Stage and AV", "Expo booths", "Run-of-show", "Live streaming"],
      },
      {
        title: "Phygital Installations (AR Booths, QR Mechanics, Touchscreen Kiosks)",
        body: "Installations that turn a visit into a data point and a share: AR photo booths, scan-to-play QR mechanics and touchscreen kiosks.",
        chips: ["AR booths", "QR mechanics", "Touchscreen kiosks", "Live dashboards"],
      },
      {
        title: "High-Impact OOH & Transit Advertising",
        body: "Billboards, digital screens and transit placements, planned around the routes your audience actually travels.",
        chips: ["Billboards", "Digital screens", "Transit wraps", "Route planning"],
      },
    ],
  },
  {
    id: "games",
    color: "--c-games",
    short: "Games & interactive",
    title: "Game Development & Interactive Experiences",
    summary:
      "Games and real-time 3D, from full mobile titles to playable ads and virtual showrooms.",
    icon: icon(
      '<rect x="6" y="15" width="36" height="20" rx="10"/><path d="M15 21v8M11 25h8"/><circle cx="31" cy="23" r="1.6" fill="currentColor"/><circle cx="35" cy="27" r="1.6" fill="currentColor"/>'
    ),
    deliverables: [
      {
        title: "Mobile & Web Game Development (Unity & Unreal Engine)",
        body: "Complete games for iOS, Android and the browser, built in Unity or Unreal by a team that has taken titles through launch and live updates.",
        chips: ["Unity", "Unreal Engine", "Live ops", "Store launch"],
      },
      {
        title: "Gamified Marketing & Browser-based Advergames",
        body: "Short, playable browser games that hand out rewards and collect opt-ins for a campaign.",
        chips: ["HTML5 games", "Leaderboards", "Reward mechanics", "Lead capture"],
      },
      {
        title: "3D Modeling, Animation & WebGL/Three.js Interactive Showcases",
        body: "Product models, animated explainers and interactive 3D on the web, like the prism at the top of this page.",
        chips: ["Product modeling", "Animation", "Three.js and WebGL", "3D configurators"],
      },
      {
        title: "AR/VR Immersive Simulations & Virtual Showrooms",
        body: "Training simulations and walk-through showrooms for headsets, phones and the browser.",
        chips: ["VR training", "AR try-on", "Virtual showrooms", "Meta Quest"],
      },
    ],
  },
  {
    id: "talent",
    color: "--c-talent",
    short: "Tech staffing",
    title: "Tech Staffing & Resource Augmentation",
    summary:
      "Vetted engineers, AI specialists and creative pods who join your team quickly and work in your tools and your hours.",
    icon: icon(
      '<circle cx="18" cy="17" r="6"/><circle cx="33" cy="19" r="4.5"/><path d="M7 39c0-6.6 4.9-11 11-11s11 4.4 11 11"/><path d="M30 29.5c1-.3 2-.5 3-.5 4.6 0 8 3.3 8 8.5"/>'
    ),
    deliverables: [
      {
        title: "Dedicated Engineering Teams (Frontend, Backend, Full-Stack)",
        body: "Engineers who work as part of your team: in your repos, your standups and your sprint board.",
        chips: ["Frontend", "Backend", "Full-stack", "QA"],
      },
      {
        title: "Specialized AI & Data Talent (ML Engineers, Prompt Architects)",
        body: "ML engineers, data engineers and prompt architects for the AI work your current team doesn't have time or experience for.",
        chips: ["ML engineers", "Data engineers", "Prompt architects", "MLOps"],
      },
      {
        title: "On-Demand Creative & Growth Pods (UI/UX, 3D Artists, Media Buyers)",
        body: "Small cross-functional pods, such as a designer, a 3D artist and a media buyer, that you can bring in for a single campaign.",
        chips: ["UI/UX designers", "3D artists", "Media buyers", "Copywriters"],
      },
      {
        title: "Flexible Engagement Models (Contract-to-hire, Staff Augmentation)",
        body: "Hire by the month, by the project, or contract-to-hire, and change the size of the team as your roadmap changes.",
        chips: ["Staff augmentation", "Contract-to-hire", "Project-based", "Monthly retainer"],
      },
    ],
  },
];
