import React, { useState, useMemo } from 'react';
import { MapPin, Plus, Edit2, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query'; 
import { getLocations, getCompanies } from '../lib/api';
import { Table } from '../components/ui/Table';
import { GridView } from '../components/ui/GridView';
import { ViewToggle } from '../components/ui/ViewToggle';
import { SearchBar } from '../components/ui/SearchBar';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { Modal } from '../components/ui/Modal';
import { LocationForm } from '../components/locations/LocationForm';
import { LocationEditForm } from '../components/locations/LocationEditForm';
import { LocationCard } from '../components/locations/LocationCard';
import type { Location } from '../types';

const getColumns = (onEdit: (location: Location) => void) => [
  { header: 'Name', accessorKey: 'name' },
  { header: 'Address', accessorKey: 'address' },
  { header: 'City', accessorKey: 'city' },
  { header: 'State', accessorKey: 'state' },
  { header: 'Country', accessorKey: 'country' },
  {
    header: 'Criticality',
    accessorKey: 'criticality',
    cell: (value: string) => {
      const colors = {
        High: 'text-red-500',
        Medium: 'text-yellow-500',
        Low: 'text-green-500'
      }[value] || 'text-gray-500';
      return <span className={colors}>{value}</span>;
    }
  },
  { 
    header: 'Company',
    accessorKey: 'company',
    cell: (value: any) => value?.name || 'N/A'
  }
];

export function Locations() {
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const hasFilters = search || stateFilter || cityFilter || criticalityFilter || companyFilter;

  const clearFilters = () => {
    setSearch('');
    setStateFilter('');
    setCityFilter('');
    setCriticalityFilter('');
    setCompanyFilter('');
  };
  
  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations', search, stateFilter, cityFilter, criticalityFilter, companyFilter],
    queryFn: () => getLocations({
      search: search ? search.trim() : undefined,
      state: stateFilter,
      city: cityFilter,
      criticality: criticalityFilter,
      company_id: companyFilter
    }),
    keepPreviousData: true
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies
  });

  const filters = React.useMemo(() => {
    if (!locations) return { states: [], cities: [] };

    const states = [...new Set(locations.map(l => l.state))].sort().map(state => ({
      value: state,
      label: state
    }));

    const cities = [...new Set(locations.map(l => l.city))].sort().map(city => ({
      value: city,
      label: city
    }));

    return { states, cities };
  }, [locations]);

  const companyOptions = React.useMemo(() => {
    return (companies || []).sort((a, b) => a.name.localeCompare(b.name)).map(company => ({
      value: company.id,
      label: company.name
    })) || [];
  }, [companies]);

  const criticalityOptions = [
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' }
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Locations</h1>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-4 flex items-center space-x-1 px-2 py-1 text-sm text-gray-500 
                         hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                         bg-gray-100 dark:bg-gray-700 rounded-md"
              >
                <X className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <ViewToggle view={view} onViewChange={setView} />
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90
                       flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Location</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search locations..."
            />
          </div>
          <div className="flex space-x-4">
            <FilterDropdown
              value={stateFilter}
              onChange={setStateFilter}
              options={filters.states}
              label="All States"
            />
            <FilterDropdown
              value={cityFilter}
              onChange={setCityFilter}
              options={filters.cities}
              label="All Cities"
            />
            <FilterDropdown
              value={criticalityFilter}
              onChange={setCriticalityFilter}
              options={criticalityOptions}
              label="All Criticality"
            />
            <FilterDropdown
              value={companyFilter}
              onChange={setCompanyFilter}
              options={companyOptions}
              label="All Companies"
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Location"
      >
        <LocationForm onClose={() => setIsModalOpen(false)} />
      </Modal>

      <Modal
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        title="Edit Location"
      >
        {editingLocation && (
          <LocationEditForm
            location={editingLocation}
            onClose={() => setEditingLocation(null)}
          />
        )}
      </Modal>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          view === 'table' ? (
            <Table
              data={locations || []}
              columns={getColumns(setEditingLocation)}
              onRowClick={setEditingLocation}
            />
          ) : (
            <GridView
              data={locations || []}
              renderCard={(location) => (
                <div
                  onClick={() => setEditingLocation(location)}
                  className="cursor-pointer"
                >
                  <LocationCard location={location} />
                </div>
              )}
            />
          )
        )}
      </div>
    </div>
  );
}