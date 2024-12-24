import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { CountrySelect } from './CountrySelect';
import { StateSelect } from './StateSelect';
import { AddressAutocomplete } from './AddressAutocomplete';
import { validateAddress } from '../../lib/maps';
import type { AddressFormData } from '../../types';

interface AddressFormProps {
  value: AddressFormData;
  onChange: (address: AddressFormData) => void;
  error?: string;
}

export function AddressForm({ value, onChange, error }: AddressFormProps) {
  const [isAutocompleteEnabled, setIsAutocompleteEnabled] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleManualToggle = () => {
    setIsAutocompleteEnabled(!isAutocompleteEnabled);
  };

  const handleAutocompleteSelect = (address: AddressFormData) => {
    onChange(address);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value: fieldValue } = e.target;
    onChange({ ...value, [name]: fieldValue });
    setValidationError(null);
  };

  const validateAndUpdate = async (newAddress: AddressFormData) => {
    setIsValidating(true);
    setValidationError(null);
    
    try {
      const isValid = await validateAddress(newAddress);
      if (!isValid) {
        setValidationError('Please enter a valid address');
      }
    } catch (error) {
      console.error('Address validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (!isAutocompleteEnabled && value.street && value.city && value.state && value.zip_code) {
      validateAndUpdate(value);
    }
  }, [value, isAutocompleteEnabled]);

  return (
    <div className="space-y-4">
      {isAutocompleteEnabled ? (
        <>
          <AddressAutocomplete
            onSelect={handleAutocompleteSelect}
            defaultValue={value.street}
          />
          <button
            type="button"
            onClick={handleManualToggle}
            className="text-sm text-primary hover:text-primary/90"
          >
            Enter address manually
          </button>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Street Address *
            </label>
            <div className="mt-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="street"
                required
                value={value.street}
                onChange={handleFieldChange}
                className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                         focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter street address"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                City *
              </label>
              <input
                type="text"
                name="city"
                required
                value={value.city}
                onChange={handleFieldChange}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                         focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <StateSelect
              value={value.state}
              onChange={(state) => onChange({ ...value, state })}
              country={value.country}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                ZIP Code *
              </label>
              <input
                type="text"
                name="zip_code"
                required
                value={value.zip_code}
                onChange={handleFieldChange}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                         focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <CountrySelect
              value={value.country}
              onChange={(country) => onChange({ ...value, country })}
            />
          </div>

          <button
            type="button"
            onClick={handleManualToggle}
            className="text-sm text-primary hover:text-primary/90"
          >
            Use address autocomplete
          </button>
        </>
      )}

      {(error || validationError) && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
          {error || validationError}
        </p>
      )}
      
      {isValidating && (
        <div className="flex items-center justify-center text-sm text-primary">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          Validating address...
        </div>
      )}
    </div>
  );
}