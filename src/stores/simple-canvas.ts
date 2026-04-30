import { create } from "zustand";
import { Viewport, ChannelCard, CardVariant, Position, ContentElement, ImageFit, ImageVariationOption } from "@/types/simple-canvas";
import { useCanvasStore } from "@/stores/canvas";
import { useRegulatedContentStore, elementKey } from "@/stores/regulated-content";
import { buildMakanaOncuraEmailCards } from "@/data/makana-pharma-canvas";

let _compliancePulseTimer: ReturnType<typeof setTimeout> | null = null;

// Selected element reference
export interface SelectedElement {
  cardId: string;
  elementId: string;
}

export interface CardGroup {
  id: string;
  name: string;
  cardIds: string[];
  tags: string[];
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export type InitialGenPhase = null | "analyzing" | "generating" | "complete";

interface SimpleCanvasState {
  viewport: Viewport;
  cards: ChannelCard[];
  selectedCardId: string | null;
  selectedCardIds: string[];
  selectedElement: SelectedElement | null;
  selectedVariantId: string | null;
  isPanning: boolean;
  isGenerating: boolean;
  initialGenPhase: InitialGenPhase;
  showAssetPicker: boolean;
  hiddenCardIds: Set<string>;
  hiddenChannels: Set<string>;
  cardGroups: CardGroup[];
  hiddenGroupIds: Set<string>;
  selectedGroupId: string | null;
  generatedImages: Array<{ id: string; src: string; alt: string }>;
  /** `${cardId}:${elementId}` — transient highlight when jumping from inspector flags */
  compliancePulseKey: string | null;
}

interface SimpleCanvasStore extends SimpleCanvasState {
  // Viewport
  pan: (deltaX: number, deltaY: number) => void;
  zoom: (delta: number, centerX?: number, centerY?: number) => void;
  resetViewport: () => void;
  fitToContent: () => void;
  focusCard: (id: string) => void;
  pulseComplianceOnElement: (cardId: string, elementId: string) => void;

  // Selection
  selectCard: (id: string | null) => void;
  toggleCardSelection: (id: string) => void;
  selectMultipleCards: (ids: string[]) => void;
  selectElement: (cardId: string, elementId: string) => void;
  selectVariant: (cardId: string, variantId: string | null) => void;
  clearSelection: () => void;
  clearElementSelection: () => void;
  isCardSelected: (id: string) => boolean;
  
  // Cards
  addCard: (card: ChannelCard) => void;
  updateCard: (id: string, updates: Partial<ChannelCard>) => void;
  moveCard: (id: string, position: Position) => void;
  moveCards: (updates: { id: string; position: Position }[]) => void;
  removeCard: (id: string) => void;
  duplicateCard: (id: string) => string | null;
  
  // Elements
  addElement: (cardId: string, element: ContentElement) => void;
  insertElement: (cardId: string, element: ContentElement, atIndex: number) => void;
  updateElement: (cardId: string, elementId: string, updates: Partial<ContentElement>) => void;
  removeElement: (cardId: string, elementId: string) => void;
  
  // Variants
  addVariant: (cardId: string, variant?: CardVariant) => void;
  removeVariant: (cardId: string, variantId: string) => void;
  addVariantElement: (cardId: string, variantId: string, element: ContentElement) => void;
  removeVariantElement: (cardId: string, variantId: string, elementId: string) => void;
  reorderVariantElements: (cardId: string, variantId: string, elements: ContentElement[]) => void;
  updateVariantElement: (cardId: string, variantId: string, elementId: string, updates: Partial<ContentElement>) => void;

  // Image operations
  setImageFit: (cardId: string, elementId: string, fit: ImageFit) => void;
  replaceImage: (cardId: string, elementId: string, src: string, alt: string) => void;
  setImageVariations: (cardId: string, elementId: string, options: ImageVariationOption[]) => void;
  selectImageVariation: (cardId: string, elementId: string, index: number) => void;
  setImageVariationsRefreshing: (cardId: string, elementId: string, isRefreshing: boolean) => void;
  clearImageVariations: (cardId: string, elementId: string) => void;
  addGeneratedImages: (images: Array<{ src: string; alt: string }>) => void;
  
  // Asset picker
  setShowAssetPicker: (show: boolean) => void;
  
  // Visibility
  toggleCardVisibility: (cardId: string) => void;
  toggleChannelVisibility: (channel: string) => void;
  isCardHidden: (cardId: string) => boolean;
  isChannelHidden: (channel: string) => boolean;
  showAllCards: () => void;

  // Groups
  createGroup: (name: string, cardIds: string[]) => string;
  renameGroup: (groupId: string, name: string) => void;
  removeGroup: (groupId: string) => void;
  addToGroup: (groupId: string, cardIds: string[]) => void;
  removeFromGroup: (groupId: string, cardIds: string[]) => void;
  toggleGroupVisibility: (groupId: string) => void;
  selectGroup: (groupId: string) => void;
  focusGroup: (groupId: string) => void;
  duplicateGroup: (groupId: string) => string | null;
  addGroupTag: (groupId: string, tag: string) => void;
  removeGroupTag: (groupId: string, tag: string) => void;
  moveGroup: (groupId: string, position: { x: number; y: number }) => void;
  resizeGroup: (groupId: string, position: { x: number; y: number }, size: { width: number; height: number }) => void;

  // State
  setPanning: (isPanning: boolean) => void;
  setGenerating: (isGenerating: boolean) => void;
  setInitialGenPhase: (phase: InitialGenPhase) => void;
  
  // Data
  loadInitialData: () => void;
  reset: () => void;
  revealReserveTemplate: (channel: "email" | "sms") => ChannelCard | null;
  
  // Undo
  undo: () => void;
  
  // Helpers
  getSelectedElementData: () => { card: ChannelCard; element: ContentElement } | null;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

const initialViewport: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

const MAX_HISTORY = 30;

interface HistorySnapshot {
  cards: ChannelCard[];
  cardGroups: CardGroup[];
}

const _history: HistorySnapshot[] = [];

function pushHistory(state: { cards: ChannelCard[]; cardGroups: CardGroup[] }) {
  _history.push(JSON.parse(JSON.stringify({ cards: state.cards, cardGroups: state.cardGroups })));
  if (_history.length > MAX_HISTORY) _history.shift();
}

const initialState: SimpleCanvasState = {
  viewport: initialViewport,
  cards: [],
  selectedCardId: null,
  selectedCardIds: [],
  selectedElement: null,
  selectedVariantId: null,
  isPanning: false,
  isGenerating: false,
  initialGenPhase: null,
  showAssetPicker: false,
  hiddenCardIds: new Set<string>(),
  hiddenChannels: new Set<string>(),
  cardGroups: [],
  hiddenGroupIds: new Set<string>(),
  selectedGroupId: null,
  generatedImages: [],
  compliancePulseKey: null,
};

function buildWilliamsSonomaInitialCards(): ChannelCard[] {
    // ── Williams-Sonoma "Steak Frites Collection" Campaign ──
    // Generated from merchant brief targeting home-cooking enthusiasts & gift shoppers

    const EMAIL_W = 360;
    const SMS_W = 320;
    const GAP = 40;  // horizontal gap between cards
    const COL = EMAIL_W + GAP; // column spacing
    const VGAP = 32; // vertical gap between cards

    const WS_LOGO = { src: "/images/ws/logo.png", alt: "Williams Sonoma", fit: "contain" as const };

    // Estimate rendered height per card based on element types
    function estimateHeight(elements: ChannelCard["elements"], isEmail: boolean): number {
      const HEADER = 56; // card header bar
      const PAD = isEmail ? 48 : 32;    // top + bottom padding
      let h = HEADER + PAD;
      for (const el of elements) {
        switch (el.type) {
          case "image": {
            const fit = el.imageData?.fit || "cover";
            h += fit === "contain" ? 56 : 200; // logo vs hero
            break;
          }
          case "headline": h += 52; break;
          case "body": {
            const lines = el.content.split("\n").length;
            const charLen = el.content.length;
            const wrappedLines = Math.max(lines, Math.ceil(charLen / 40));
            h += Math.max(48, wrappedLines * 22 + 20);
            break;
          }
          case "cta": h += 56; break;
          case "divider": h += 20; break;
        }
      }
      return h;
    }

    const cards: ChannelCard[] = [
      // ─── EMAILS ───────────────────────────────────────────────

      // 1 · Campaign Hero — full launch email with logo, hero, dual body + CTA
      {
        id: "e-hero",
        channel: "email",
        title: "Campaign Launch",
        subjectLine: "Introducing the Steak Frites Collection",
        preheader: "Everything you need for the perfect bistro night at home",
        status: "draft",
        tags: ["hero", "launch"],
        position: { x: 0, y: 0 },
        size: { width: EMAIL_W, height: 0 },
        elements: [
          { id: "e-hero-logo", type: "image", content: "Williams Sonoma", imageData: WS_LOGO },
          { id: "e-hero-img", type: "image", content: "Hero Banner", imageData: { src: "/images/ws/email-hero.jpg", alt: "Steak Frites Collection", fit: "cover" } },
          { id: "e-hero-h1", type: "headline", content: "The Art of Steak Frites" },
          { id: "e-hero-body", type: "body", content: "Hi {{first_name}},\n\nFrom hand-hammered copper pans to artisanal Dijon mustard, discover our curated collection for the ultimate bistro experience — right in your kitchen." },
          { id: "e-hero-cta", type: "cta", content: "Shop the Collection" },
          { id: "e-hero-div", type: "divider", content: "" },
          { id: "e-hero-body2", type: "body", content: "Free shipping on orders over $99 · Complimentary gift wrapping · Easy 30-day returns" },
        ],
        variants: [
          {
            id: "e-hero-v2",
            label: "Variant 2",
            status: "draft",
            elements: [
              { id: "e-hero-logo-v2", type: "image", content: "Williams Sonoma", imageData: { src: "/images/ws/logo.png", alt: "Williams Sonoma", fit: "contain" as const } },
              { id: "e-hero-img-v2", type: "image", content: "Hero Banner", imageData: { src: "/images/ws/email-hero.jpg", alt: "Steak Frites Collection", fit: "cover" } },
              { id: "e-hero-h1-v2", type: "headline", content: "The Art of Steak Frites" },
              { id: "e-hero-body-v2", type: "body", content: "Hi {{first_name}},\n\nFrom hand-hammered copper pans to artisanal Dijon mustard, discover our curated collection for the ultimate bistro experience — right in your kitchen." },
              { id: "e-hero-cta-v2", type: "cta", content: "Shop the Collection" },
            ],
          },
          {
            id: "e-hero-v3",
            label: "Variant 3",
            status: "draft",
            elements: [
              { id: "e-hero-logo-v3", type: "image", content: "Williams Sonoma", imageData: { src: "/images/ws/logo.png", alt: "Williams Sonoma", fit: "contain" as const } },
              { id: "e-hero-img-v3", type: "image", content: "Hero Banner", imageData: { src: "/images/ws/email-hero.jpg", alt: "Steak Frites Collection", fit: "cover" } },
              { id: "e-hero-h1-v3", type: "headline", content: "The Art of Steak Frites" },
              { id: "e-hero-body-v3", type: "body", content: "Hi {{first_name}},\n\nFrom hand-hammered copper pans to artisanal Dijon mustard, discover our curated collection for the ultimate bistro experience — right in your kitchen." },
              { id: "e-hero-cta-v3", type: "cta", content: "Shop the Collection" },
            ],
          },
        ],
      },

      // 2 · Copper Cookware — product deep-dive with specs
      {
        id: "e-copper",
        channel: "email",
        title: "Copper Cookware",
        subjectLine: "Crafted in France: Our Copper Cookware Edit",
        preheader: "Hand-hammered copper with brass & walnut handles",
        status: "draft",
        tags: ["product", "cookware"],
        position: { x: 0, y: 0 },
        size: { width: EMAIL_W, height: 0 },
        elements: [
          { id: "e-copper-logo", type: "image", content: "Williams Sonoma", imageData: WS_LOGO },
          { id: "e-copper-h1", type: "headline", content: "The Pan Behind the Perfect Sear" },
          { id: "e-copper-img", type: "image", content: "Copper Pan", imageData: { src: "/images/ws/product-detail.jpg", alt: "Copper Frying Pan", fit: "cover" } },
          { id: "e-copper-body", type: "body", content: "Our hand-hammered copper fry pan delivers unparalleled heat distribution for restaurant-quality results. Paired with a solid brass and walnut handle." },
          { id: "e-copper-body2", type: "body", content: "• 2.5mm thick copper construction\n• Stainless steel interior lining\n• Oven safe to 500°F\n• Hand-hammered in Villedieu-les-Poêles, France" },
          { id: "e-copper-cta", type: "cta", content: "Explore Cookware — From $189" },
          { id: "e-copper-div", type: "divider", content: "" },
          { id: "e-copper-img2", type: "image", content: "Lifestyle", imageData: { src: "/images/ws/lifestyle.jpg", alt: "Copper pan lifestyle", fit: "cover" } },
          { id: "e-copper-cta2", type: "cta", content: "See All Copper Cookware" },
        ],
      },

      // 3 · Recipe — editorial content with ingredients + steps
      {
        id: "e-recipe",
        channel: "email",
        title: "Steak au Poivre Recipe",
        subjectLine: "Recipe: Classic Steak au Poivre Vert",
        preheader: "A step-by-step guide with our Chef's tips",
        status: "draft",
        tags: ["recipe", "content"],
        position: { x: 0, y: 0 },
        size: { width: EMAIL_W, height: 0 },
        elements: [
          { id: "e-recipe-logo", type: "image", content: "Williams Sonoma", imageData: WS_LOGO },
          { id: "e-recipe-img", type: "image", content: "Steak Flat Lay", imageData: { src: "/images/ws/gourmet-flat-lay.jpg", alt: "Steak au Poivre", fit: "cover" } },
          { id: "e-recipe-h1", type: "headline", content: "Master the Classic" },
          { id: "e-recipe-body", type: "body", content: "Steak au Poivre Vert\nServes 2 · 30 minutes\n\nCrushed green peppercorns, a splash of cognac, and a swirl of cream — the quintessential French bistro dinner." },
          { id: "e-recipe-div", type: "divider", content: "" },
          { id: "e-recipe-body2", type: "body", content: "What you'll need from the collection:\n• Copper Fry Pan 12\"\n• Laguiole Steak Knives\n• Edmond Fallot Green Peppercorns\n• Edmond Fallot Dijon Mustard" },
          { id: "e-recipe-cta", type: "cta", content: "Get the Full Recipe" },
          { id: "e-recipe-cta2", type: "cta", content: "Shop the Ingredients" },
        ],
      },

      // 4 · Best Seller — short, punchy urgency email
      {
        id: "e-best",
        channel: "email",
        title: "Best Seller Alert",
        subjectLine: "Our #1 Best Seller Is Back in Stock",
        preheader: "The copper fry pan everyone's talking about",
        status: "draft",
        tags: ["best-seller", "urgency"],
        position: { x: 0, y: 0 },
        size: { width: EMAIL_W, height: 0 },
        elements: [
          { id: "e-best-logo", type: "image", content: "Williams Sonoma", imageData: WS_LOGO },
          { id: "e-best-img", type: "image", content: "Best Seller", imageData: { src: "/images/ws/best-seller.jpg", alt: "Best Seller Copper Pan", fit: "cover" } },
          { id: "e-best-h1", type: "headline", content: "Back by Popular Demand" },
          { id: "e-best-body", type: "body", content: "{{first_name}}, our most-loved copper fry pan is back in stock — but not for long. Last time it sold out in 48 hours." },
          { id: "e-best-cta", type: "cta", content: "Shop Before It's Gone" },
        ],
      },

      // 5 · Entertaining Guide — editorial with two product sections
      {
        id: "e-entertain",
        channel: "email",
        title: "Entertaining Guide",
        subjectLine: "Host the Perfect French Bistro Night",
        preheader: "A curated guide for an unforgettable dinner party",
        status: "draft",
        tags: ["lifestyle", "guide"],
        position: { x: 0, y: 0 },
        size: { width: EMAIL_W, height: 0 },
        elements: [
          { id: "e-ent-logo", type: "image", content: "Williams Sonoma", imageData: WS_LOGO },
          { id: "e-ent-h1", type: "headline", content: "Your Guide to a French Bistro Night" },
          { id: "e-ent-body", type: "body", content: "Set the scene for an unforgettable evening. We've planned every detail so you can focus on the company." },
          { id: "e-ent-img", type: "image", content: "Dining Set", imageData: { src: "/images/ws/dining-set.jpg", alt: "French Bistro Table", fit: "cover" } },
          { id: "e-ent-body2", type: "body", content: "The Table\nBlue-rimmed bistro plates, Laguiole steak knives with cobalt handles, linen napkins, and a single white rose." },
          { id: "e-ent-cta", type: "cta", content: "Shop the Tablescape" },
          { id: "e-ent-div", type: "divider", content: "" },
          { id: "e-ent-img2", type: "image", content: "Flat Lay", imageData: { src: "/images/ws/flat-lay.jpg", alt: "French ingredients", fit: "cover" } },
          { id: "e-ent-body3", type: "body", content: "The Menu\nSteak au Poivre Vert with hand-cut frites, a mesclun salad, and Edmond Fallot Dijon on the side. Pair with a bold Cabernet." },
          { id: "e-ent-cta2", type: "cta", content: "Browse the Full Guide" },
        ],
      },

      // 6 · Sale — bold promo with hero image, code, and terms
      {
        id: "e-sale",
        channel: "email",
        title: "Limited Time Sale",
        subjectLine: "Up to 25% Off Select Gourmet Kitchenware",
        preheader: "This weekend only — our best prices of the season",
        status: "draft",
        tags: ["sale", "promo"],
        position: { x: 0, y: 0 },
        size: { width: EMAIL_W, height: 0 },
        elements: [
          { id: "e-sale-img", type: "image", content: "Sale Banner", imageData: { src: "/images/ws/sale-banner.jpg", alt: "Sale on Kitchenware", fit: "cover" } },
          { id: "e-sale-h1", type: "headline", content: "Weekend Sale: Up to 25% Off" },
          { id: "e-sale-body", type: "body", content: "For a limited time, save on select copper cookware, French cutlery, and artisanal pantry items.\n\nUse code BISTRO25 at checkout." },
          { id: "e-sale-cta", type: "cta", content: "Shop the Sale" },
          { id: "e-sale-div", type: "divider", content: "" },
          { id: "e-sale-body2", type: "body", content: "Offer valid through Sunday at midnight EST. Cannot be combined with other promotions. Excludes monogramming." },
        ],
      },

      // 7 · Gift Guide — multiple product picks with individual CTAs
      {
        id: "e-gift",
        channel: "email",
        title: "Gift Guide",
        subjectLine: "The Ultimate Gift for the Home Chef",
        preheader: "Curated sets they'll love — ready to gift",
        status: "draft",
        tags: ["gift", "curation"],
        position: { x: 0, y: 0 },
        size: { width: EMAIL_W, height: 0 },
        elements: [
          { id: "e-gift-logo", type: "image", content: "Williams Sonoma", imageData: WS_LOGO },
          { id: "e-gift-h1", type: "headline", content: "Gifts They'll Actually Use" },
          { id: "e-gift-body", type: "body", content: "Curated picks for the culinary enthusiast in your life. Complimentary gift wrapping on all orders." },
          { id: "e-gift-div1", type: "divider", content: "" },
          { id: "e-gift-img1", type: "image", content: "Kitchenware", imageData: { src: "/images/ws/kitchenware.jpg", alt: "Gift Set", fit: "cover" } },
          { id: "e-gift-body2", type: "body", content: "The Copper Essentials Set — $349\nOur best-selling copper fry pan and saucier, gift-boxed with a French linen towel." },
          { id: "e-gift-cta1", type: "cta", content: "Shop This Gift" },
          { id: "e-gift-div2", type: "divider", content: "" },
          { id: "e-gift-img2", type: "image", content: "Ingredients", imageData: { src: "/images/ws/ingredients.jpg", alt: "Pantry Gift", fit: "cover" } },
          { id: "e-gift-body3", type: "body", content: "The French Pantry Box — $89\nEdmond Fallot Dijon, green peppercorns, fleur de sel, and a recipe card for Steak au Poivre." },
          { id: "e-gift-cta2", type: "cta", content: "Shop This Gift" },
        ],
      },

      // 8 · Pantry — short product-focused email
      {
        id: "e-pantry",
        channel: "email",
        title: "Pantry Essentials",
        subjectLine: "New In: Artisanal French Pantry Staples",
        preheader: "Dijon mustard, green peppercorns & more — imported from France",
        status: "draft",
        tags: ["product", "food"],
        position: { x: 0, y: 0 },
        size: { width: EMAIL_W, height: 0 },
        elements: [
          { id: "e-pantry-logo", type: "image", content: "Williams Sonoma", imageData: WS_LOGO },
          { id: "e-pantry-img", type: "image", content: "Gourmet Ingredients", imageData: { src: "/images/ws/ingredients.jpg", alt: "Artisanal Ingredients", fit: "cover" } },
          { id: "e-pantry-h1", type: "headline", content: "Straight from France to Your Pantry" },
          { id: "e-pantry-body", type: "body", content: "The finishing touches that transform a good steak into an extraordinary one:\n\n• Edmond Fallot Dijon Mustard — $12\n• Whole Green Peppercorns — $9\n• Fleur de Sel de Guérande — $14" },
          { id: "e-pantry-cta", type: "cta", content: "Shop Pantry" },
        ],
      },

      // 9 · VIP — exclusive, no-image, text-forward luxury feel
      {
        id: "e-vip",
        channel: "email",
        title: "VIP Early Access",
        subjectLine: "You're Invited: Early Access Starts Now",
        preheader: "Shop before everyone else — exclusive to loyalty members",
        status: "draft",
        tags: ["loyalty", "exclusive"],
        position: { x: 0, y: 0 },
        size: { width: EMAIL_W, height: 0 },
        elements: [
          { id: "e-vip-logo", type: "image", content: "Williams Sonoma", imageData: WS_LOGO },
          { id: "e-vip-div1", type: "divider", content: "" },
          { id: "e-vip-h1", type: "headline", content: "Exclusive Early Access" },
          { id: "e-vip-body", type: "body", content: "Dear {{first_name}},\n\nAs a valued member of our loyalty program, you have been selected for 48-hour early access to the Steak Frites Collection.\n\nYour personal discount of 20% has been applied automatically — no code needed." },
          { id: "e-vip-cta", type: "cta", content: "Shop Your Exclusive Preview" },
          { id: "e-vip-div2", type: "divider", content: "" },
          { id: "e-vip-body2", type: "body", content: "This invitation expires Friday at 10am EST, when the collection opens to the public. Questions? Contact your personal stylist at vip@williams-sonoma.com." },
        ],
      },

      // 10 · Cutlery — storytelling with two images
      {
        id: "e-cutlery",
        channel: "email",
        title: "Laguiole Cutlery",
        subjectLine: "Meet the Knives Behind the Perfect Cut",
        preheader: "Handcrafted Laguiole steak knives with cobalt blue handles",
        status: "draft",
        tags: ["product", "cutlery"],
        position: { x: 0, y: 0 },
        size: { width: EMAIL_W, height: 0 },
        elements: [
          { id: "e-cutlery-logo", type: "image", content: "Williams Sonoma", imageData: WS_LOGO },
          { id: "e-cutlery-img", type: "image", content: "Flat Lay", imageData: { src: "/images/ws/flat-lay.jpg", alt: "Laguiole Cutlery", fit: "cover" } },
          { id: "e-cutlery-h1", type: "headline", content: "Laguiole: A Tradition of Excellence" },
          { id: "e-cutlery-body", type: "body", content: "Hand-forged in the Aubrac region of France since 1829. Each knife features the iconic bee emblem and signature cobalt blue handles crafted from compressed linen." },
          { id: "e-cutlery-img2", type: "image", content: "Detail", imageData: { src: "/images/ws/natural-light.jpg", alt: "Cutlery detail", fit: "cover" } },
          { id: "e-cutlery-body2", type: "body", content: "Available as a set of 6 ($249) or individually ($45 each). Monogramming available for $10 per knife." },
          { id: "e-cutlery-cta", type: "cta", content: "Shop Laguiole Cutlery" },
        ],
      },

      // 11 · Last Chance — minimal, urgent
      {
        id: "e-lastchance",
        channel: "email",
        title: "Last Chance",
        subjectLine: "Final Hours: Sale Ends Tonight",
        preheader: "Don't miss 25% off — your cart is waiting",
        status: "draft",
        tags: ["urgency", "sale"],
        position: { x: 0, y: 0 },
        size: { width: EMAIL_W, height: 0 },
        elements: [
          { id: "e-lc-img", type: "image", content: "Limited Offer", imageData: { src: "/images/ws/limited-offer.jpg", alt: "Last Chance Sale", fit: "cover" } },
          { id: "e-lc-h1", type: "headline", content: "Last Call" },
          { id: "e-lc-body", type: "body", content: "{{first_name}}, 25% off the Steak Frites Collection ends tonight at midnight.\n\nCode: BISTRO25" },
          { id: "e-lc-cta", type: "cta", content: "Complete Your Order" },
        ],
      },

      // 12 · Win-back — warm, text-heavy reconnection
      {
        id: "e-winback",
        channel: "email",
        title: "We Miss You",
        subjectLine: "It's Been a While — Here's 15% Off",
        preheader: "Come back and discover what's new in the kitchen",
        status: "draft",
        tags: ["winback", "retention"],
        position: { x: 0, y: 0 },
        size: { width: EMAIL_W, height: 0 },
        elements: [
          { id: "e-wb-logo", type: "image", content: "Williams Sonoma", imageData: WS_LOGO },
          { id: "e-wb-img", type: "image", content: "Hero Banner", imageData: { src: "/images/ws/hero-banner.jpg", alt: "Welcome Back", fit: "cover" } },
          { id: "e-wb-h1", type: "headline", content: "There's More to Love" },
          { id: "e-wb-body", type: "body", content: "Hi {{first_name}},\n\nIt's been a while! We've been busy curating new collections and we think you'll love what's new." },
          { id: "e-wb-cta", type: "cta", content: "See What's New" },
          { id: "e-wb-div", type: "divider", content: "" },
          { id: "e-wb-body2", type: "body", content: "As a welcome back gift, enjoy 15% off your next order with code WELCOME15. Valid for 7 days." },
          { id: "e-wb-cta2", type: "cta", content: "Redeem Your Offer" },
        ],
      },

      // ─── SMS ───────────────────────────────────────────────────

      // 13 · Launch SMS
      {
        id: "s-launch",
        channel: "sms",
        title: "Collection Launch",
        status: "draft",
        tags: ["launch"],
        position: { x: 0, y: 0 },
        size: { width: SMS_W, height: 0 },
        elements: [
          { id: "s-launch-body", type: "body", content: "WILLIAMS SONOMA: {{first_name}}, the Steak Frites Collection just dropped! Premium copper cookware, French cutlery & artisanal ingredients. Shop now: ws.com/steakfrites" },
          { id: "s-launch-cta", type: "cta", content: "Reply STOP to opt out" },
        ],
      },

      // 14 · Flash Sale
      {
        id: "s-flash",
        channel: "sms",
        title: "Flash Sale Alert",
        status: "draft",
        tags: ["sale", "urgency"],
        position: { x: 0, y: 0 },
        size: { width: SMS_W, height: 0 },
        elements: [
          { id: "s-flash-body", type: "body", content: "🔥 FLASH SALE: 25% off our Steak Frites Collection — today only! Use code BISTRO25 at checkout. Shop: ws.com/sale" },
          { id: "s-flash-cta", type: "cta", content: "Reply STOP to opt out" },
        ],
      },

      // 15 · Recipe SMS
      {
        id: "s-recipe",
        channel: "sms",
        title: "Recipe of the Week",
        status: "draft",
        tags: ["content", "recipe"],
        position: { x: 0, y: 0 },
        size: { width: SMS_W, height: 0 },
        elements: [
          { id: "s-recipe-body", type: "body", content: "🥩 This week's recipe: Classic Steak au Poivre Vert. Crushed peppercorns, cognac cream sauce & hand-cut frites. Get the full recipe: ws.com/recipes/steak-au-poivre" },
          { id: "s-recipe-cta", type: "cta", content: "Reply STOP to opt out" },
        ],
      },

      // 16 · Low Stock
      {
        id: "s-lowstock",
        channel: "sms",
        title: "Low Stock Alert",
        status: "draft",
        tags: ["urgency", "inventory"],
        position: { x: 0, y: 0 },
        size: { width: SMS_W, height: 0 },
        elements: [
          { id: "s-ls-body", type: "body", content: "{{first_name}}, heads up — the Copper Fry Pan you viewed is almost sold out. Only 3 left in stock! Grab yours: ws.com/copper-pan" },
          { id: "s-ls-cta", type: "cta", content: "Reply STOP to opt out" },
        ],
      },

      // 17 · Free Shipping
      {
        id: "s-shipping",
        channel: "sms",
        title: "Free Shipping",
        status: "draft",
        tags: ["promo", "shipping"],
        position: { x: 0, y: 0 },
        size: { width: SMS_W, height: 0 },
        elements: [
          { id: "s-ship-body", type: "body", content: "📦 FREE shipping on all Steak Frites Collection orders this weekend! No minimum. No code needed. Shop: ws.com/steakfrites" },
          { id: "s-ship-cta", type: "cta", content: "Reply STOP to opt out" },
        ],
      },

      // 18 · Cart Abandonment
      {
        id: "s-cart",
        channel: "sms",
        title: "Cart Reminder",
        status: "draft",
        tags: ["abandonment", "retention"],
        position: { x: 0, y: 0 },
        size: { width: SMS_W, height: 0 },
        elements: [
          { id: "s-cart-body", type: "body", content: "{{first_name}}, you left something behind! Your copper pan is still in your cart. Complete your order and get free shipping today: ws.com/cart" },
          { id: "s-cart-cta", type: "cta", content: "Reply STOP to opt out" },
        ],
      },

      // 19 · Post-Purchase Thank You
      {
        id: "s-thanks",
        channel: "sms",
        title: "Post-Purchase",
        status: "draft",
        tags: ["post-purchase", "loyalty"],
        position: { x: 0, y: 0 },
        size: { width: SMS_W, height: 0 },
        elements: [
          { id: "s-thanks-body", type: "body", content: "Thank you for your order, {{first_name}}! 🎉 Your Steak Frites Collection items are on the way. Track your shipment: ws.com/orders" },
          { id: "s-thanks-cta", type: "cta", content: "Reply STOP to opt out" },
        ],
      },

      // 20 · Review Request
      {
        id: "s-review",
        channel: "sms",
        title: "Review Request",
        status: "draft",
        tags: ["review", "post-purchase"],
        position: { x: 0, y: 0 },
        size: { width: SMS_W, height: 0 },
        elements: [
          { id: "s-review-body", type: "body", content: "{{first_name}}, how's your new copper pan? ⭐ We'd love your feedback — leave a review and get 10% off your next order: ws.com/review" },
          { id: "s-review-cta", type: "cta", content: "Reply STOP to opt out" },
        ],
      },

      // 21 · VIP Early Access SMS
      {
        id: "s-vip",
        channel: "sms",
        title: "VIP Early Access",
        status: "draft",
        tags: ["loyalty", "exclusive"],
        position: { x: 0, y: 0 },
        size: { width: SMS_W, height: 0 },
        elements: [
          { id: "s-vip-body", type: "body", content: "🌟 VIP EXCLUSIVE: {{first_name}}, shop the Steak Frites Collection 48 hours before everyone else. Your early access link: ws.com/vip/steakfrites" },
          { id: "s-vip-cta", type: "cta", content: "Reply STOP to opt out" },
        ],
      },

      // 22 · Last Chance SMS
      {
        id: "s-lastchance",
        channel: "sms",
        title: "Sale Ending",
        status: "draft",
        tags: ["urgency", "sale"],
        position: { x: 0, y: 0 },
        size: { width: SMS_W, height: 0 },
        elements: [
          { id: "s-lc-body", type: "body", content: "⏰ FINAL HOURS: 25% off the Steak Frites Collection ends TONIGHT at midnight. Don't miss out: ws.com/sale Code: BISTRO25" },
          { id: "s-lc-cta", type: "cta", content: "Reply STOP to opt out" },
        ],
      },
    ];

    // ── Dynamic layout: SMS first (2 rows), then emails below ──
    const COLS = 4;
    const X_START = 80;
    const Y_START = 80;
    const SMS_COL = SMS_W + GAP;
    const SMS_COLS = 5;

    const emails = cards.filter((c) => c.channel === "email");
    const smsList = cards.filter((c) => c.channel === "sms");

    // Compute heights and assign sizes
    for (const c of cards) {
      const isEmail = c.channel === "email";
      c.size.height = estimateHeight(c.elements, isEmail);
    }

    // Layout SMS first in 5-col grid (top rows)
    let y = Y_START;
    let smsBottomY = Y_START;
    for (let row = 0; row < Math.ceil(smsList.length / SMS_COLS); row++) {
      const rowCards = smsList.slice(row * SMS_COLS, (row + 1) * SMS_COLS);
      let maxH = 0;
      for (let col = 0; col < rowCards.length; col++) {
        rowCards[col].position = { x: X_START + col * SMS_COL, y };
        if (rowCards[col].size.height > maxH) maxH = rowCards[col].size.height;
      }
      smsBottomY = y + maxH;
      y += maxH + VGAP;
    }

    // Layout emails below SMS — 60px visual gap
    y = Y_START + 250;
    for (let row = 0; row < Math.ceil(emails.length / COLS); row++) {
      const rowCards = emails.slice(row * COLS, (row + 1) * COLS);
      let maxH = 0;
      for (let col = 0; col < rowCards.length; col++) {
        rowCards[col].position = { x: X_START + col * COL, y };
        if (rowCards[col].size.height > maxH) maxH = rowCards[col].size.height;
      }
      y += maxH + VGAP;
    }

    return cards;
}

const INITIAL_EMAIL_IDS = ["e-hero", "e-copper", "e-recipe", "e-best"];
const INITIAL_SMS_IDS = ["s-launch", "s-flash", "s-recipe"];
const INITIAL_IDS = new Set([...INITIAL_EMAIL_IDS, ...INITIAL_SMS_IDS]);

function getInitialCards(projectId?: string): ChannelCard[] {
  const id = projectId ?? useCanvasStore.getState().projectId;
  if (id === "proj-pharma-email") {
    return buildMakanaOncuraEmailCards();
  }
  return buildWilliamsSonomaInitialCards().filter((c) => INITIAL_IDS.has(c.id));
}

let _reserveTemplates: ChannelCard[] | null = null;

function getReserveTemplates(): ChannelCard[] {
  const id = useCanvasStore.getState().projectId;
  if (id === "proj-pharma-email") {
    return [];
  }
  if (!_reserveTemplates) {
    _reserveTemplates = buildWilliamsSonomaInitialCards().filter((c) => !INITIAL_IDS.has(c.id));
  }
  return _reserveTemplates;
}

export function popReserveTemplate(channel: "email" | "sms"): ChannelCard | null {
  const reserves = getReserveTemplates();
  const idx = reserves.findIndex((c) => c.channel === channel);
  if (idx < 0) return null;
  return reserves.splice(idx, 1)[0];
}

export const useSimpleCanvasStore = create<SimpleCanvasStore>((set, get) => ({
  ...initialState,

  pan: (deltaX, deltaY) => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x + deltaX,
        y: state.viewport.y + deltaY,
      },
    }));
  },

  zoom: (delta, centerX = window.innerWidth / 2, centerY = window.innerHeight / 2) => {
    set((state) => {
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.viewport.zoom + delta));
      const zoomRatio = newZoom / state.viewport.zoom;
      const newX = centerX - (centerX - state.viewport.x) * zoomRatio;
      const newY = centerY - (centerY - state.viewport.y) * zoomRatio;
      return {
        viewport: { x: newX, y: newY, zoom: newZoom },
      };
    });
  },

  resetViewport: () => {
    set({ viewport: initialViewport });
  },

  focusCard: (id) => {
    const { cards } = get();
    const card = cards.find((c) => c.id === id);
    if (!card) return;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const zoom = 1;
    const x = (screenW / 2) - (card.position.x + card.size.width / 2) * zoom;
    const y = (screenH / 2) - (card.position.y + card.size.height / 2) * zoom;

    set({ viewport: { x, y, zoom } });
  },

  pulseComplianceOnElement: (cardId, elementId) => {
    const key = `${cardId}:${elementId}`;
    if (_compliancePulseTimer) {
      clearTimeout(_compliancePulseTimer);
      _compliancePulseTimer = null;
    }
    set({ compliancePulseKey: key });
    _compliancePulseTimer = setTimeout(() => {
      set((s) => (s.compliancePulseKey === key ? { compliancePulseKey: null } : {}));
      _compliancePulseTimer = null;
    }, 3200);
  },

  fitToContent: () => {
    const { cards } = get();
    if (cards.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const card of cards) {
      minX = Math.min(minX, card.position.x);
      minY = Math.min(minY, card.position.y);
      maxX = Math.max(maxX, card.position.x + card.size.width);
      maxY = Math.max(maxY, card.position.y + card.size.height);
    }

    const padding = 80;
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    let zoom = Math.min(
      (screenW - padding * 2) / contentW,
      (screenH - padding * 2) / contentH,
      1,
    );
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));

    const scaledW = contentW * zoom;
    const scaledH = contentH * zoom;
    const x = (screenW - scaledW) / 2 - minX * zoom;
    const y = (screenH - scaledH) / 2 - minY * zoom;

    set({ viewport: { x, y, zoom } });
  },

  selectCard: (id) => {
    set({ selectedCardId: id, selectedCardIds: id ? [id] : [], selectedElement: null, selectedVariantId: null, selectedGroupId: null });
  },

  toggleCardSelection: (id) => {
    set((state) => {
      const ids = state.selectedCardIds.includes(id)
        ? state.selectedCardIds.filter((i) => i !== id)
        : [...state.selectedCardIds, id];
      const primary = ids.length > 0 ? ids[ids.length - 1] : null;
      return { selectedCardId: primary, selectedCardIds: ids, selectedElement: null, selectedVariantId: null, selectedGroupId: null };
    });
  },

  selectMultipleCards: (ids) => {
    set({
      selectedCardIds: ids,
      selectedCardId: ids.length > 0 ? ids[ids.length - 1] : null,
      selectedElement: null,
      selectedVariantId: null,
      selectedGroupId: null,
    });
  },

  selectElement: (cardId, elementId) => {
    set({ selectedCardId: cardId, selectedCardIds: [cardId], selectedElement: { cardId, elementId }, selectedVariantId: null });
  },

  selectVariant: (cardId, variantId) => {
    set({ selectedCardId: cardId, selectedCardIds: [cardId], selectedElement: null, selectedVariantId: variantId });
  },

  clearSelection: () => {
    if (_compliancePulseTimer) {
      clearTimeout(_compliancePulseTimer);
      _compliancePulseTimer = null;
    }
    set({
      selectedCardId: null,
      selectedCardIds: [],
      selectedElement: null,
      selectedVariantId: null,
      selectedGroupId: null,
      compliancePulseKey: null,
    });
  },

  isCardSelected: (id) => {
    return get().selectedCardIds.includes(id);
  },

  clearElementSelection: () => {
    set({ selectedElement: null });
  },

  addCard: (card) => {
    pushHistory(get());
    set((state) => ({
      cards: [...state.cards, card],
    }));
  },

  updateCard: (id, updates) => {
    pushHistory(get());
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, ...updates } : card
      ),
    }));
  },

  moveCard: (id, position) => {
    // Note: no history push for drag moves (too frequent)
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, position } : card
      ),
    }));
  },

  moveCards: (updates) => {
    // Note: no history push for drag moves (too frequent)
    const map = new Map(updates.map((u) => [u.id, u.position]));
    set((state) => ({
      cards: state.cards.map((card) => {
        const pos = map.get(card.id);
        return pos ? { ...card, position: pos } : card;
      }),
    }));
  },

  removeCard: (id) => {
    pushHistory(get());
    set((state) => ({
      cards: state.cards.filter((card) => card.id !== id),
      selectedCardId: state.selectedCardId === id ? null : state.selectedCardId,
      // Also remove from any groups
      cardGroups: state.cardGroups
        .map((g) => ({ ...g, cardIds: g.cardIds.filter((cid) => cid !== id) }))
        .filter((g) => g.cardIds.length > 0),
    }));
  },

  duplicateCard: (id) => {
    const state = get();
    const source = state.cards.find((c) => c.id === id);
    if (!source) return null;
    const newId = `${source.channel}-card-${Date.now()}`;
    const clone: ChannelCard = {
      ...structuredClone(source),
      id: newId,
      title: `${source.title} (copy)`,
      position: { x: source.position.x + 40, y: source.position.y + 40 },
    };
    // Re-generate element ids
    clone.elements = clone.elements.map((el) => ({ ...el, id: `${el.id}-dup-${Date.now()}` }));
    if (clone.variants) {
      clone.variants = clone.variants.map((v) => ({
        ...v,
        id: `${v.id}-dup-${Date.now()}`,
        elements: v.elements.map((el) => ({ ...el, id: `${el.id}-dup-${Date.now()}` })),
      }));
    }
    pushHistory(state);
    set({ cards: [...state.cards, clone], selectedCardId: newId, selectedCardIds: [newId] });
    return newId;
  },

  addElement: (cardId, element) => {
    pushHistory(get());
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId
          ? { ...card, elements: [...card.elements, element] }
          : card
      ),
    }));
  },

  insertElement: (cardId, element, atIndex) => {
    pushHistory(get());
    set((state) => ({
      cards: state.cards.map((card) => {
        if (card.id !== cardId) return card;
        const els = [...card.elements];
        els.splice(atIndex, 0, element);
        return { ...card, elements: els };
      }),
    }));
  },

  updateElement: (cardId, elementId, updates) => {
    pushHistory(get());
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              elements: card.elements.map((el) =>
                el.id === elementId ? { ...el, ...updates } : el
              ),
            }
          : card
      ),
    }));
  },

  removeElement: (cardId, elementId) => {
    pushHistory(get());
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId
          ? { ...card, elements: card.elements.filter((el) => el.id !== elementId) }
          : card
      ),
      selectedElement: state.selectedElement?.elementId === elementId ? null : state.selectedElement,
    }));
  },

  addVariant: (cardId, variant) => {
    pushHistory(get());
    set((state) => ({
      cards: state.cards.map((card) => {
        if (card.id !== cardId) return card;
        const existing = card.variants ?? [];
        const newVariant: CardVariant = variant ?? {
          id: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          label: `Variant ${existing.length + 2}`,
          status: "draft",
          elements: card.elements.map((el) => ({
            ...el,
            id: `${el.id}-v${existing.length + 2}`,
            imageData: el.imageData ? { ...el.imageData } : undefined,
          })),
        };
        return { ...card, variants: [...existing, newVariant] };
      }),
    }));
  },

  removeVariant: (cardId, variantId) => {
    pushHistory(get());
    set((state) => ({
      cards: state.cards.map((card) => {
        if (card.id !== cardId) return card;
        const variants = (card.variants ?? []).filter((v) => v.id !== variantId);
        return { ...card, variants: variants.length > 0 ? variants : undefined };
      }),
    }));
  },

  addVariantElement: (cardId, variantId, element) => {
    pushHistory(get());
    set((state) => ({
      cards: state.cards.map((card) => {
        if (card.id !== cardId) return card;
        return {
          ...card,
          variants: (card.variants ?? []).map((v) =>
            v.id === variantId ? { ...v, elements: [...v.elements, element] } : v
          ),
        };
      }),
    }));
  },

  removeVariantElement: (cardId, variantId, elementId) => {
    pushHistory(get());
    set((state) => ({
      cards: state.cards.map((card) => {
        if (card.id !== cardId) return card;
        return {
          ...card,
          variants: (card.variants ?? []).map((v) =>
            v.id === variantId ? { ...v, elements: v.elements.filter((el) => el.id !== elementId) } : v
          ),
        };
      }),
      selectedElement: state.selectedElement?.elementId === elementId ? null : state.selectedElement,
    }));
  },

  reorderVariantElements: (cardId, variantId, elements) => {
    pushHistory(get());
    set((state) => ({
      cards: state.cards.map((card) => {
        if (card.id !== cardId) return card;
        return {
          ...card,
          variants: (card.variants ?? []).map((v) =>
            v.id === variantId ? { ...v, elements } : v
          ),
        };
      }),
    }));
  },

  updateVariantElement: (cardId, variantId, elementId, updates) => {
    pushHistory(get());
    set((state) => ({
      cards: state.cards.map((card) => {
        if (card.id !== cardId) return card;
        return {
          ...card,
          variants: (card.variants ?? []).map((v) =>
            v.id === variantId
              ? { ...v, elements: v.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el)) }
              : v
          ),
        };
      }),
    }));
  },

  setImageFit: (cardId, elementId, fit) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              elements: card.elements.map((el) =>
                el.id === elementId
                  ? { ...el, imageData: { ...(el.imageData || { src: "", alt: el.content }), fit } }
                  : el
              ),
            }
          : card
      ),
    }));
  },

  replaceImage: (cardId, elementId, src, alt) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              elements: card.elements.map((el) =>
                el.id === elementId
                  ? {
                      ...el,
                      content: alt,
                      imageData: { src, alt, fit: el.imageData?.fit || "cover" },
                    }
                  : el
              ),
            }
          : card
      ),
    }));
  },

  setImageVariations: (cardId, elementId, options) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              elements: card.elements.map((el) =>
                el.id === elementId
                  ? { ...el, imageVariations: { options, selectedIndex: 0, isRefreshing: false } }
                  : el
              ),
            }
          : card
      ),
    }));
  },

  selectImageVariation: (cardId, elementId, index) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              elements: card.elements.map((el) => {
                if (el.id !== elementId || !el.imageVariations) return el;
                const opt = el.imageVariations.options[index];
                if (!opt) return el;
                return {
                  ...el,
                  imageData: { src: opt.src, alt: opt.alt, fit: el.imageData?.fit || "cover" },
                  imageVariations: { ...el.imageVariations, selectedIndex: index },
                };
              }),
            }
          : card
      ),
    }));
  },

  setImageVariationsRefreshing: (cardId, elementId, isRefreshing) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              elements: card.elements.map((el) =>
                el.id === elementId && el.imageVariations
                  ? { ...el, imageVariations: { ...el.imageVariations, isRefreshing } }
                  : el
              ),
            }
          : card
      ),
    }));
  },

  clearImageVariations: (cardId, elementId) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              elements: card.elements.map((el) =>
                el.id === elementId ? { ...el, imageVariations: undefined } : el
              ),
            }
          : card
      ),
    }));
  },

  addGeneratedImages: (images) => {
    set((state) => {
      const existing = new Set(state.generatedImages.map((g) => g.src));
      const fresh = images
        .filter((img) => !existing.has(img.src))
        .map((img) => ({ id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...img }));
      return { generatedImages: [...state.generatedImages, ...fresh] };
    });
  },

  setShowAssetPicker: (show) => {
    set({ showAssetPicker: show });
  },

  toggleCardVisibility: (cardId) => {
    set((state) => {
      const next = new Set(state.hiddenCardIds);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return { hiddenCardIds: next };
    });
  },

  toggleChannelVisibility: (channel) => {
    set((state) => {
      const nextChannels = new Set(state.hiddenChannels);
      const nextCards = new Set(state.hiddenCardIds);
      if (nextChannels.has(channel)) {
        nextChannels.delete(channel);
        // Show all cards of this channel
        for (const card of state.cards) {
          if (card.channel === channel) nextCards.delete(card.id);
        }
      } else {
        nextChannels.add(channel);
        // Hide all cards of this channel
        for (const card of state.cards) {
          if (card.channel === channel) nextCards.add(card.id);
        }
      }
      return { hiddenChannels: nextChannels, hiddenCardIds: nextCards };
    });
  },

  isCardHidden: (cardId) => {
    return get().hiddenCardIds.has(cardId);
  },

  isChannelHidden: (channel) => {
    return get().hiddenChannels.has(channel);
  },

  showAllCards: () => {
    set({ hiddenCardIds: new Set(), hiddenChannels: new Set(), hiddenGroupIds: new Set() });
  },

  // Groups
  createGroup: (name, cardIds) => {
    pushHistory(get());
    const id = `group-${Date.now()}`;
    const PAD = 24;
    const LABEL_H = 28;
    const GAP = 32;
    const state = get();
    const groupCards = cardIds.map((cid) => state.cards.find((c) => c.id === cid)).filter(Boolean);
    if (groupCards.length === 0) return id;

    // Find the bounding box of ALL existing cards/groups to place the new group below
    let canvasMaxY = -Infinity;
    let canvasMinX = Infinity;
    for (const c of state.cards) {
      canvasMaxY = Math.max(canvasMaxY, c.position.y + c.size.height);
      canvasMinX = Math.min(canvasMinX, c.position.x);
    }
    for (const g of state.cardGroups) {
      canvasMaxY = Math.max(canvasMaxY, g.position.y + g.size.height);
      canvasMinX = Math.min(canvasMinX, g.position.x);
    }
    if (!isFinite(canvasMaxY)) canvasMaxY = 0;
    if (!isFinite(canvasMinX)) canvasMinX = 0;

    const startX = canvasMinX;
    const startY = canvasMaxY + 80;

    // Layout cards side-by-side inside the new group area
    let cursorX = startX + PAD;
    const cursorY = startY + PAD + LABEL_H;
    let maxCardH = 0;
    const cardUpdates = new Map<string, { x: number; y: number }>();
    for (const c of groupCards) {
      if (!c) continue;
      cardUpdates.set(c.id, { x: cursorX, y: cursorY });
      cursorX += c.size.width + GAP;
      maxCardH = Math.max(maxCardH, c.size.height);
    }

    const frameWidth = cursorX - startX - GAP + PAD;
    const frameHeight = maxCardH + PAD * 2 + LABEL_H;
    const position = { x: startX, y: startY };
    const size = { width: frameWidth, height: frameHeight };

    // Apply card position updates
    const updatedCards = state.cards.map((c) => {
      const pos = cardUpdates.get(c.id);
      return pos ? { ...c, position: pos } : c;
    });

    pushHistory(state);
    set({
      cards: updatedCards,
      cardGroups: [
        ...state.cardGroups.map((g) => ({
          ...g,
          cardIds: g.cardIds.filter((cid) => !cardIds.includes(cid)),
        })).filter((g) => g.cardIds.length > 0),
        { id, name, cardIds: [...cardIds], tags: [], position, size },
      ],
      selectedGroupId: id,
      selectedCardId: cardIds[0],
      selectedCardIds: [...cardIds],
      selectedElement: null,
      selectedVariantId: null,
    });

    // Focus on the new group
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const padding = 120;
    let zoom = Math.min(
      (screenW - padding * 2) / size.width,
      (screenH - padding * 2) / size.height,
      1,
    );
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    const scaledW = size.width * zoom;
    const scaledH = size.height * zoom;
    const vx = (screenW - scaledW) / 2 - position.x * zoom;
    const vy = (screenH - scaledH) / 2 - position.y * zoom;
    set({ viewport: { x: vx, y: vy, zoom } });

    return id;
  },

  renameGroup: (groupId, name) => {
    pushHistory(get());
    set((state) => ({
      cardGroups: state.cardGroups.map((g) =>
        g.id === groupId ? { ...g, name } : g
      ),
    }));
  },

  removeGroup: (groupId) => {
    pushHistory(get());
    set((state) => ({
      cardGroups: state.cardGroups.filter((g) => g.id !== groupId),
      hiddenGroupIds: (() => { const s = new Set(state.hiddenGroupIds); s.delete(groupId); return s; })(),
    }));
  },

  addToGroup: (groupId, cardIds) => {
    pushHistory(get());
    set((state) => ({
      cardGroups: state.cardGroups.map((g) =>
        g.id === groupId
          ? { ...g, cardIds: [...new Set([...g.cardIds, ...cardIds])] }
          : g
      ),
    }));
  },

  removeFromGroup: (groupId, cardIds) => {
    pushHistory(get());
    set((state) => ({
      cardGroups: state.cardGroups
        .map((g) =>
          g.id === groupId
            ? { ...g, cardIds: g.cardIds.filter((cid) => !cardIds.includes(cid)) }
            : g
        )
        .filter((g) => g.cardIds.length > 0),
    }));
  },

  toggleGroupVisibility: (groupId) => {
    set((state) => {
      const nextGroups = new Set(state.hiddenGroupIds);
      const nextCards = new Set(state.hiddenCardIds);
      const group = state.cardGroups.find((g) => g.id === groupId);
      if (!group) return {};
      if (nextGroups.has(groupId)) {
        nextGroups.delete(groupId);
        for (const cid of group.cardIds) nextCards.delete(cid);
      } else {
        nextGroups.add(groupId);
        for (const cid of group.cardIds) nextCards.add(cid);
      }
      return { hiddenGroupIds: nextGroups, hiddenCardIds: nextCards };
    });
  },

  selectGroup: (groupId) => {
    const { cardGroups } = get();
    const group = cardGroups.find((g) => g.id === groupId);
    if (!group || group.cardIds.length === 0) return;

    set({
      selectedCardId: group.cardIds[0],
      selectedCardIds: [...group.cardIds],
      selectedElement: null,
      selectedVariantId: null,
      selectedGroupId: groupId,
    });
  },

  focusGroup: (groupId) => {
    const { cards, cardGroups } = get();
    const group = cardGroups.find((g) => g.id === groupId);
    if (!group || group.cardIds.length === 0) return;

    const groupCards = group.cardIds.map((cid) => cards.find((c) => c.id === cid)).filter(Boolean);
    if (groupCards.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const card of groupCards) {
      if (!card) continue;
      minX = Math.min(minX, card.position.x);
      minY = Math.min(minY, card.position.y);
      maxX = Math.max(maxX, card.position.x + card.size.width);
      maxY = Math.max(maxY, card.position.y + card.size.height);
    }

    const padding = 120;
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    let zoom = Math.min(
      (screenW - padding * 2) / contentW,
      (screenH - padding * 2) / contentH,
      1,
    );
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));

    const scaledW = contentW * zoom;
    const scaledH = contentH * zoom;
    const x = (screenW - scaledW) / 2 - minX * zoom;
    const y = (screenH - scaledH) / 2 - minY * zoom;

    set({ viewport: { x, y, zoom } });
  },

  duplicateGroup: (groupId) => {
    const state = get();
    const group = state.cardGroups.find((g) => g.id === groupId);
    if (!group) return null;

    const newGroupId = `group-${Date.now()}`;
    const idMap = new Map<string, string>();
    const newCards: ChannelCard[] = [];

    for (const cardId of group.cardIds) {
      const source = state.cards.find((c) => c.id === cardId);
      if (!source) continue;
      const newId = `${source.channel}-card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      idMap.set(cardId, newId);
      const clone: ChannelCard = {
        ...structuredClone(source),
        id: newId,
        title: `${source.title} (copy)`,
        position: { x: source.position.x + 60, y: source.position.y + 60 },
      };
      clone.elements = clone.elements.map((el) => ({ ...el, id: `${el.id}-dup-${Date.now()}` }));
      if (clone.variants) {
        clone.variants = clone.variants.map((v) => ({
          ...v,
          id: `${v.id}-dup-${Date.now()}`,
          elements: v.elements.map((el) => ({ ...el, id: `${el.id}-dup-${Date.now()}` })),
        }));
      }
      newCards.push(clone);
    }

    pushHistory(state);
    set({
      cards: [...state.cards, ...newCards],
      cardGroups: [
        ...state.cardGroups,
        { id: newGroupId, name: `${group.name} (copy)`, cardIds: newCards.map((c) => c.id), tags: [...group.tags], position: { x: group.position.x + 60, y: group.position.y + 60 }, size: { ...group.size } },
      ],
      selectedGroupId: newGroupId,
      selectedCardId: newCards[0]?.id ?? null,
      selectedCardIds: newCards.map((c) => c.id),
      selectedElement: null,
      selectedVariantId: null,
    });
    return newGroupId;
  },

  addGroupTag: (groupId, tag) => {
    pushHistory(get());
    set((state) => ({
      cardGroups: state.cardGroups.map((g) =>
        g.id === groupId && !g.tags.includes(tag)
          ? { ...g, tags: [...g.tags, tag] }
          : g
      ),
    }));
  },

  removeGroupTag: (groupId, tag) => {
    pushHistory(get());
    set((state) => ({
      cardGroups: state.cardGroups.map((g) =>
        g.id === groupId
          ? { ...g, tags: g.tags.filter((t) => t !== tag) }
          : g
      ),
    }));
  },

  moveGroup: (groupId, position) => {
    set((state) => ({
      cardGroups: state.cardGroups.map((g) =>
        g.id === groupId ? { ...g, position } : g
      ),
    }));
  },

  resizeGroup: (groupId, position, size) => {
    set((state) => ({
      cardGroups: state.cardGroups.map((g) =>
        g.id === groupId ? { ...g, position, size } : g
      ),
    }));
  },

  setPanning: (isPanning) => {
    set({ isPanning });
  },

  setGenerating: (isGenerating) => {
    set({ isGenerating });
  },

  setInitialGenPhase: (phase) => {
    set({ initialGenPhase: phase });
  },

  loadInitialData: () => {
    _reserveTemplates = null;
    const projectId = useCanvasStore.getState().projectId;
    if (projectId === "proj-pharma-email") {
      useRegulatedContentStore.setState({
        creatorComplianceFlags: { [elementKey("mh-oncura-email-1", "mh1-body2")]: true },
      });
    } else {
      useRegulatedContentStore.setState({ creatorComplianceFlags: {} });
    }
    set({
      cards: getInitialCards(projectId),
      selectedCardId: null,
      selectedElement: null,
      isGenerating: false,
      compliancePulseKey: null,
    });
  },

  revealReserveTemplate: (channel) => {
    const template = popReserveTemplate(channel);
    if (!template) return null;
    const { cards } = get();
    const channelCards = cards.filter((c) => c.channel === channel);
    const maxX = channelCards.reduce((mx, c) => Math.max(mx, c.position.x + c.size.width), 80);
    const avgY = channelCards.length > 0
      ? channelCards.reduce((sum, c) => sum + c.position.y, 0) / channelCards.length
      : 80;
    const positioned: ChannelCard = {
      ...template,
      status: "generating",
      position: { x: maxX + 40, y: avgY },
    };
    pushHistory(get());
    set({ cards: [...cards, positioned], selectedCardId: positioned.id });
    get().focusCard(positioned.id);
    return positioned;
  },

  reset: () => {
    _history.length = 0;
    _reserveTemplates = null;
    if (_compliancePulseTimer) {
      clearTimeout(_compliancePulseTimer);
      _compliancePulseTimer = null;
    }
    set(initialState);
  },

  undo: () => {
    const prev = _history.pop();
    if (prev) {
      set({ cards: prev.cards, cardGroups: prev.cardGroups });
    }
  },

  getSelectedElementData: () => {
    const state = get();
    if (!state.selectedElement) return null;
    const card = state.cards.find((c) => c.id === state.selectedElement!.cardId);
    if (!card) return null;
    const elementId = state.selectedElement!.elementId;
    // Search main elements first
    let element = card.elements.find((e) => e.id === elementId);
    // If not found, search variant elements
    if (!element && card.variants) {
      for (const v of card.variants) {
        element = v.elements.find((e) => e.id === elementId);
        if (element) break;
      }
    }
    if (!element) return null;
    return { card, element };
  },
}));

// Progressive generation helper
export async function simulateCardGeneration(
  prompt: string,
  onStepComplete: (step: string, detail?: string) => void,
) {
  const store = useSimpleCanvasStore.getState();
  store.setGenerating(true);
  store.reset();

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Step 1: Understanding
  onStepComplete("understand", "Analyzing campaign request...");
  await delay(800);

  // Step 2: Planning
  onStepComplete("plan", "Planning channel content...");
  await delay(600);

  // Step 3: Create Email card (empty first)
  const emailCard: ChannelCard = {
    id: `email-${Date.now()}`,
    channel: "email",
    title: "Email",
    status: "generating",
    position: { x: 100, y: 100 },
    size: { width: 360, height: 480 },
    elements: [],
  };
  store.addCard(emailCard);
  store.fitToContent();
  onStepComplete("email-start", "Creating email content...");
  await delay(400);

  // Add email elements progressively
  store.addElement(emailCard.id, { 
    id: "email-img", 
    type: "image", 
    content: "Hero Banner",
    imageData: { src: "/images/hero-spring.jpg", alt: "Hero Banner", fit: "cover" }
  });
  await delay(300);
  store.addElement(emailCard.id, { id: "email-h1", type: "headline", content: extractHeadline(prompt) });
  await delay(300);
  store.addElement(emailCard.id, { id: "email-body", type: "body", content: generateEmailBody(prompt) });
  await delay(300);
  store.addElement(emailCard.id, { id: "email-cta", type: "cta", content: "Shop Now" });
  store.updateCard(emailCard.id, { status: "draft" });
  onStepComplete("email-done", "Email content ready");
  await delay(400);

  // Step 4: Create SMS card
  const smsCard: ChannelCard = {
    id: `sms-${Date.now()}`,
    channel: "sms",
    title: "SMS",
    status: "generating",
    position: { x: 520, y: 100 },
    size: { width: 320, height: 280 },
    elements: [],
  };
  store.addCard(smsCard);
  store.fitToContent();
  onStepComplete("sms-start", "Creating SMS content...");
  await delay(400);

  // Add SMS elements
  store.addElement(smsCard.id, { id: "sms-body", type: "body", content: generateSmsBody(prompt) });
  await delay(300);
  store.addElement(smsCard.id, { id: "sms-footer", type: "cta", content: "Reply STOP to opt out" });
  store.updateCard(smsCard.id, { status: "draft" });
  onStepComplete("sms-done", "SMS content ready");
  await delay(300);

  // Complete
  store.setGenerating(false);
  store.fitToContent();
  onStepComplete("complete", "Campaign ready for review");
}

function extractHeadline(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("spring")) return "Spring Collection is Here";
  if (lower.includes("sale") || lower.includes("discount")) return "Don't Miss Our Special Offer";
  if (lower.includes("launch")) return "Introducing Something New";
  if (lower.includes("holiday")) return "Celebrate the Season";
  return "Discover What's New";
}

function generateEmailBody(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("spring")) {
    return "Hi {{first_name}},\n\nDiscover our latest spring arrivals. Fresh styles perfect for the new season are waiting for you.";
  }
  if (lower.includes("sale")) {
    return "Hi {{first_name}},\n\nOur biggest sale of the season is here! Don't miss exclusive savings on your favorite items.";
  }
  return "Hi {{first_name}},\n\nWe have something special to share with you. Explore our latest collection today.";
}

function generateSmsBody(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("spring")) {
    return "{{first_name}}, Spring styles just dropped! 🌸 Get 20% off with code SPRING20. Shop now: [link]";
  }
  if (lower.includes("sale")) {
    return "{{first_name}}, FLASH SALE! 🔥 Up to 50% off ends tonight. Shop: [link]";
  }
  return "{{first_name}}, something new just for you! Check it out: [link]";
}

/** Skeleton card for lazy-load simulation: no real copy or images in the DOM. */
function toLazySkeletonCard(card: ChannelCard): ChannelCard {
  return {
    ...card,
    title: "",
    subjectLine: undefined,
    preheader: undefined,
    status: "generating",
    elements: card.elements.map((el) => ({
      ...el,
      isLoading: true,
      content: "",
      imageData: undefined,
    })),
  };
}

/**
 * Simulates the initial generation animation when opening a new campaign.
 * Canvas stays blank, then cards appear as gray placeholders (no text/images),
 * then resolve to real content. Never commits full cards to the store before skeletons.
 */
export function simulateInitialGeneration(
  onPhase?: (phase: "analyzing" | "generating" | "complete", detail?: string) => void,
): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const delay = (ms: number) =>
    new Promise<void>((resolve) => {
      timers.push(setTimeout(resolve, ms));
    });

  const ss = useSimpleCanvasStore;

  const allCards = getInitialCards(useCanvasStore.getState().projectId);
  const savedElements = new Map<string, ChannelCard["elements"]>();
  for (const card of allCards) {
    savedElements.set(card.id, card.elements.map((el) => ({ ...el })));
  }

  const shuffled = [...allCards].sort(() => Math.random() - 0.5);

  // Single sync update: blank canvas + generating (never paint full content first)
  ss.setState({
    cards: [],
    selectedCardId: null,
    selectedElement: null,
    isGenerating: true,
    initialGenPhase: "analyzing",
  });
  ss.getState().fitToContent();
  onPhase?.("analyzing", "Understanding your request…");

  const appearMs = 8000;
  const resolveMs = 8000;
  const perAppear = Math.max(120, Math.floor(appearMs / shuffled.length));
  const perResolve = Math.max(120, Math.floor(resolveMs / shuffled.length));

  (async () => {
    await delay(1200);

    for (let i = 0; i < shuffled.length; i++) {
      const card = shuffled[i];
      const skeleton = toLazySkeletonCard(card);
      ss.setState({ cards: [...ss.getState().cards, skeleton] });

      if (i % 4 === 0) ss.getState().fitToContent();

      const jitter = Math.floor(Math.random() * perAppear * 0.6);
      await delay(perAppear * 0.7 + jitter);
    }

    ss.getState().fitToContent();

    await delay(600);
    ss.getState().setInitialGenPhase("generating");
    onPhase?.("generating", "Generating content…");

    const resolveOrder = [...shuffled].sort(() => Math.random() - 0.5);
    const byId = new Map(allCards.map((c) => [c.id, c]));
    for (let i = 0; i < resolveOrder.length; i++) {
      const card = resolveOrder[i];
      const original = savedElements.get(card.id);
      const full = byId.get(card.id);
      if (!original || !full) continue;

      ss.setState({
        cards: ss.getState().cards.map((c) =>
          c.id === card.id
            ? { ...full, status: "draft" as const, elements: original }
            : c,
        ),
      });

      const jitter = Math.floor(Math.random() * perResolve * 0.5);
      await delay(perResolve * 0.75 + jitter);
    }

    ss.getState().setGenerating(false);
    ss.getState().setInitialGenPhase("complete");
    ss.getState().fitToContent();
    onPhase?.("complete");

    timers.push(setTimeout(() => {
      ss.getState().setInitialGenPhase(null);
    }, 2000));
  })();

  return () => {
    for (const t of timers) clearTimeout(t);
    ss.getState().setGenerating(false);
    ss.getState().setInitialGenPhase(null);
    ss.setState({
      cards: allCards.map((c) => {
        const orig = savedElements.get(c.id);
        return orig ? { ...c, status: "draft" as const, elements: orig } : c;
      }),
    });
  };
}
