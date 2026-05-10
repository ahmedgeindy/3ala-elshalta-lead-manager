export interface Lead {
  id: string;
  name: string;
  phone: string;
  rawPhone: string;
  status: 'pending' | 'sent';
  rowData: Record<string, string>;
}

export interface Campaign {
  name: string;
  discount: string;
  duration: string;
  url: string;
  imageUrls: string[];   // was: imageUrl: string
}

export interface SmartMenuPage {
  id: string;
  slug: string;
  campaignName: string;
  title: string;
  offerHeadline: string;
  offerDescription: string;
  imageUrls: string[];
  orderPhone: string;
  orderMessage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
