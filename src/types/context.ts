export interface BrandKit {
  name: string;
  tone: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

export interface MockAsset {
  id: string;
  name: string;
  type: "logo" | "product";
  placeholder: string;
}

export interface Assets {
  logo: MockAsset;
  products: MockAsset[];
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
}

export interface SalesforceContext {
  brand: BrandKit;
  assets: Assets;
  audiences: AudienceSegment[];
  loadedAt: Date;
}
