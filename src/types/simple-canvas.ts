export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export type ChannelType = "email" | "sms";

export type CardStatus = "draft" | "generating" | "ready" | "review" | "approved" | "published";

export type ImageFit = "cover" | "contain";

export interface ImageData {
  src: string;
  alt: string;
  fit: ImageFit;
}

export interface ImageVariationOption {
  src: string;
  alt: string;
}

export interface ImageVariations {
  options: ImageVariationOption[];
  selectedIndex: number;
  isRefreshing: boolean;
}

export interface ContentElement {
  id: string;
  type: "image" | "headline" | "body" | "cta" | "divider";
  content: string;
  linkedClaimCodes?: string[];
  linkedClaimAdjustments?: Record<
    string,
    {
      status: "pending_variation_review";
      comment: string;
      originalText: string;
      editedText: string;
      updatedAt: number;
    }
  >;
  imageData?: ImageData;
  isLoading?: boolean;
  imageVariations?: ImageVariations;
}

export interface CardVariant {
  id: string;
  label: string;
  status: CardStatus;
  elements: ContentElement[];
}

export interface ChannelCard {
  id: string;
  channel: ChannelType;
  title: string;
  subjectLine?: string;
  preheader?: string;
  tags?: string[];
  status: CardStatus;
  position: Position;
  size: Size;
  elements: ContentElement[];
  variants?: CardVariant[];
}
