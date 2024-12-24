// Database Types
export interface Company {
  id: string;
  name: string;
  street_address: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  phone: string;
  email: string;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  criticality: string;
  created_at: string;
  updated_at: string;
  site_description: string | null;
  critical_processes: string | null;
  active_users: number;
  num_servers: number;
  hosted_applications: string | null;
  company_id: string;
  company?: {
    name: string;
  };
}

export interface Circuit {
  id: string;
  carrier: string;
  type: string;
  purpose: string;
  status: string;
  bandwidth: string;
  monthlycost: number;
  static_ips: number;
  upload_bandwidth: string | null;
  contract_start_date: string | null;
  contract_term: number | null;
  contract_end_date: string | null;
  billing: string;
  usage_charges: boolean;
  installation_cost: number;
  notes: string | null;
  location_id: string;
  location?: {
    name: string;
    company: {
      name: string;
    };
  };
}

// Component Props Types
export interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey: keyof T | string;
    cell?: (value: any, row?: T) => React.ReactNode;
  }[];
  onRowClick?: (row: T) => void;
}

export interface UserProfile {
  id: string;
  user_id: string;
  role: 'admin' | 'viewer';
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyFormData {
  name: string;
  street_address: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  phone: string;
  email: string;
  website?: string;
}

export interface AddressFormData {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}