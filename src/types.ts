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
