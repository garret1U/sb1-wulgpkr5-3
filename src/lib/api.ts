import { supabase } from './supabase';
import type { Company, Location, Circuit } from '../types';

interface CompanyFilters {
  search?: string;
  state?: string;
  city?: string;
}

// Companies
export async function getCompanies(filters?: CompanyFilters) {
  let query = supabase
    .from('companies')
    .select(`
      id,
      name,
      street_address,
      address_city,
      address_state,
      address_zip,
      address_country,
      phone,
      email,
      website,
      created_at,
      updated_at
    `);

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,` +
      `address_city.ilike.%${filters.search}%,` +
      `address_state.ilike.%${filters.search}%`
    );
  }
  
  if (filters?.state) {
    query = query.eq('address_state', filters.state);
  }
  
  if (filters?.city) {
    query = query.eq('address_city', filters.city);
  }

  const { data, error } = await query
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function getCompany(id: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createCompany(company: CompanyFormData) {
  const { data, error } = await supabase
    .from('companies')
    .insert([company])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCompany(id: string, company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('companies')
    .update({
      ...company,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateLocation(id: string, location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('locations')
    .update({
      ...location,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

interface LocationFilters {
  search?: string;
  state?: string;
  city?: string;
  criticality?: string;
  company_id?: string;
}

// Locations
export async function getLocations(filters?: LocationFilters) {
  let query = supabase
    .from('locations')
    .select(`
      id,
      name,
      address,
      city,
      state,
      zip_code,
      country,
      criticality,
      site_description,
      critical_processes,
      active_users,
      num_servers,
      hosted_applications,
      longitude,
      latitude,
      created_at,
      updated_at,
      company_id,
      company:companies(
        id,
        name
      )
    `);

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,` +
      `address.ilike.%${filters.search}%,` +
      `city.ilike.%${filters.search}%,` +
      `state.ilike.%${filters.search}%`
    );
  }
  
  if (filters?.state) {
    query = query.eq('state', filters.state);
  }
  
  if (filters?.city) {
    query = query.eq('city', filters.city);
  }
  
  if (filters?.criticality) {
    query = query.eq('criticality', filters.criticality);
  }
  
  if (filters?.company_id) {
    query = query.eq('company_id', filters.company_id);
  }

  const { data, error } = await query
    .order('name', { ascending: true })
    .throwOnError();
  
  if (error) throw error;
  return data;
}

export async function getLocation(id: string) {
  const { data, error } = await supabase
    .from('locations')
    .select(`
      *,
      company:companies(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createLocation(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('locations')
    .insert([location])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

interface CircuitFilters {
  search?: string;
  carrier?: string;
  type?: string;
  status?: string;
  location_id?: string;
}

// Circuits
export async function getCircuits(filters?: CircuitFilters) {
  let query = supabase
    .from('circuits')
    .select(`
      *,
      location:locations(
        name,
        company:companies(name)
      )
    `);

  if (filters?.search) {
    query = query.or(
      `carrier.ilike.%${filters.search}%,` +
      `type.ilike.%${filters.search}%,` +
      `bandwidth.ilike.%${filters.search}%`
    );
  }
  
  if (filters?.carrier) {
    query = query.eq('carrier', filters.carrier);
  }
  
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.location_id) {
    query = query.eq('location_id', filters.location_id);
  }

  const { data, error } = await query.order('carrier');
  
  if (error) throw error;
  return data;
}

export async function getCircuit(id: string) {
  const { data, error } = await supabase
    .from('circuits')
    .select(`
      *,
      location:locations(
        *,
        company:companies(*)
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

// Create circuit
export async function createCircuit(circuit: Omit<Circuit, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('circuits')
    .insert([circuit])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCircuit(id: string, circuit: Omit<Circuit, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('circuits')
    .update({
      ...circuit,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUserProfile(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('No authenticated user');

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .select()
    .single();
  
  if (error) throw error;
  return profile;
}

// Dashboard Stats
interface DashboardFilters {
  company_id?: string;
  location_id?: string;
}

export async function getDashboardStats(filters?: DashboardFilters) {
  let query = supabase
    .from('circuits')
    .select(`
      status,
      monthlycost,
      location:locations!inner (
        id,
        company_id
      )
    `);

  if (filters?.location_id) {
    query = query.eq('location_id', filters.location_id);
  }

  if (filters?.company_id) {
    query = query.eq('location.company_id', filters.company_id);
  }

  const { data: circuits, error } = await query;
  
  if (error) throw error;

  const totalCircuits = circuits.length;
  const activeCircuits = circuits.filter(c => c.status === 'Active').length;
  const inactiveCircuits = circuits.filter(c => c.status === 'Inactive').length;
  const totalMonthlyCost = circuits.reduce((sum, c) => sum + (c.monthlycost || 0), 0);

  return {
    totalCircuits,
    activeCircuits,
    inactiveCircuits,
    totalMonthlyCost
  };
}

export async function getCurrentUserProfile() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('No authenticated user');

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile');
  }

  if (!data) {
    // Create profile for new user
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert([{ user_id: user.id, role: 'viewer' }])
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating user profile:', createError);
      throw new Error('Failed to create user profile');
    }
    
    return newProfile;
  }

  return data;
}

// Get all user profiles (admin-only)
export async function getUserProfiles() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      user:auth.users!user_id(
        email,
        last_sign_in_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Update user role (admin-only)
export async function updateUserRole(userId: string, role: 'admin' | 'viewer') {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getEnvironmentVariable(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_environment_variable', { var_key: key })
      .single()
      .throwOnError();
    
    if (error) throw error;
    return data?.value || null;
  } catch (error) {
    console.error(`Error fetching environment variable ${key}:`, error);
    return null;
  }
}