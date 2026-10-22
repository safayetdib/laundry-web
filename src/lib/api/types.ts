export type Role = 'customer' | 'admin' | 'operations' | 'partner_staff' | 'rider' | 'support';

export interface UserDTO {
  id: string;
  name: string;
  phone: string;
  roles: Role[];
  status: 'active' | 'suspended';
  partnerId?: string;
}

export interface ServiceDTO {
  code: string;
  name: string;
  description?: string;
  pricingUnit: 'item' | 'kg' | 'order';
  sortOrder: number;
}

export interface ZoneDTO {
  id: string;
  code: string;
  name: string;
  city: string;
  localities: string[];
}

export interface PricingEntry {
  serviceCode: string;
  name: string;
  pricingUnit: string;
  unitAmount: number;
  currency: string;
}

export interface AvailableSlot {
  type: 'pickup' | 'delivery';
  label: string;
  start: string;
  end: string;
  capacity: number;
}

export interface OrderLine {
  orderItemId: string;
  serviceCode: string;
  garmentCode?: string;
  displayName: string;
  quantity: number;
  unitAmount: number;
  lineAmount: number;
}

export interface OrderQuote {
  version: number;
  status: 'pending_approval' | 'approved' | 'superseded';
  currency: string;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;
}

export interface OrderDTO {
  id: string;
  orderCode: string;
  status: string;
  currency: string;
  addressSnapshot: {
    contactName: string;
    phone: string;
    line1: string;
    area: string;
    city: string;
    note?: string;
  };
  zoneId: string;
  pickup: { type: 'pickup'; start: string; end: string };
  quote: OrderQuote;
  version: number;
  createdAt: string;
}

export interface PartnerDTO {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  serviceCodes: string[];
  zoneIds: string[];
}
