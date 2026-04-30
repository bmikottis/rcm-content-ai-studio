import { SalesforceContext } from "@/types/context";

export const mockContext: SalesforceContext = {
  brand: {
    name: "Williams Sonoma",
    tone: "Modern, refined, premium",
    colors: {
      primary: "#171717",
      secondary: "#525252",
      accent: "#A3A3A3",
      background: "#FAFAFA",
    },
  },
  assets: {
    logo: {
      id: "logo-1",
      name: "Salesforce Palette Logo",
      type: "logo",
      placeholder: "Minimalist wordmark in black",
    },
    products: [
      {
        id: "prod-1",
        name: "Signature Candle",
        type: "product",
        placeholder: "White candle, minimal packaging",
      },
      {
        id: "prod-2",
        name: "Reed Diffuser",
        type: "product",
        placeholder: "Glass vessel, natural reeds",
      },
      {
        id: "prod-3",
        name: "Room Spray",
        type: "product",
        placeholder: "Matte black bottle, clean label",
      },
    ],
  },
  audiences: [
    {
      id: "aud-1",
      name: "Urban professionals",
      description: "25-45, design-conscious, values quality",
    },
    {
      id: "aud-2",
      name: "Eco-conscious families",
      description: "30-50, sustainability-focused, natural products",
    },
  ],
  loadedAt: new Date(),
};
