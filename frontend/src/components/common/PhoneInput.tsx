import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Flag } from 'lucide-react';
import { countryCodes, CountryCode, validatePhoneNumber, formatPhoneNumber } from '../../data/countryCodes';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  countryCode: string;
  onCountryChange: (countryCode: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  error?: string;
  label?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onBlur,
  countryCode,
  onCountryChange,
  placeholder = "Enter phone number",
  required = false,
  className = "",
  error,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    countryCodes.find(c => c.code === countryCode) || countryCodes[0]
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter countries based on search term
  const filteredCountries = countryCodes.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle country selection
  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    onCountryChange(country.code);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow digits and spaces, limit to 10 digits
    const cleaned = input.replace(/[^\d\s]/g, '').replace(/\s/g, '');
    if (cleaned.length <= 10) {
      onChange(cleaned);
    }
  };

  // Format phone number on blur
  const handleBlur = () => {
    if (value && selectedCountry) {
      const formatted = formatPhoneNumber(value, selectedCountry.code);
      onChange(formatted);
    }
    // Call the onBlur prop if provided
    if (onBlur) {
      onBlur(value);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected country when countryCode prop changes
  useEffect(() => {
    const country = countryCodes.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
    }
  }, [countryCode]);

  // Validate phone number - only show error if explicitly provided
  const isValid = value ? validatePhoneNumber(value, selectedCountry.code) : true;

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Country Code Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute left-0 top-0 h-full px-3 py-2 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 z-10"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                {selectedCountry.dialCode}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Country List */}
              <div className="max-h-80 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-4 bg-gradient-to-r from-blue-500 to-green-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{country.code}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{country.name}</div>
                          <div className="text-sm text-gray-500">
                            {country.dialCode} • {country.example}
                          </div>
                        </div>
                      </div>
                      {country.code === selectedCountry.code && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-24 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
          }`}
        />

        {/* Error Message - Only show on blur if there's an error */}
        {error && (
          <div className="mt-1 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneInput;














