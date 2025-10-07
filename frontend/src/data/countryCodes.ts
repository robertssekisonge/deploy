export interface CountryCode {
  name: string;
  code: string;
  dialCode: string;
  format: string;
  example: string;
}

export const countryCodes: CountryCode[] = [
  // Uganda (Primary)
  {
    name: 'Uganda',
    code: 'UG',
    dialCode: '+256',
    format: 'XXX XXX XXX',
    example: '701 234 567'
  },
  // Kenya
  {
    name: 'Kenya',
    code: 'KE',
    dialCode: '+254',
    format: 'XXX XXX XXX',
    example: '701 234 567'
  },
  // Tanzania
  {
    name: 'Tanzania',
    code: 'TZ',
    dialCode: '+255',
    format: 'XXX XXX XXX',
    example: '701 234 567'
  },
  // Nigeria
  {
    name: 'Nigeria',
    code: 'NG',
    dialCode: '+234',
    format: 'XXX XXX XXXX',
    example: '801 234 5678'
  },
  // Ghana
  {
    name: 'Ghana',
    code: 'GH',
    dialCode: '+233',
    format: 'XX XXX XXXX',
    example: '20 123 4567'
  },
  // South Africa
  {
    name: 'South Africa',
    code: 'ZA',
    dialCode: '+27',
    format: 'XX XXX XXXX',
    example: '71 123 4567'
  },
  // Rwanda
  {
    name: 'Rwanda',
    code: 'RW',
    dialCode: '+250',
    format: 'XXX XXX XXX',
    example: '701 234 567'
  },
  // Burundi
  {
    name: 'Burundi',
    code: 'BI',
    dialCode: '+257',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Democratic Republic of Congo
  {
    name: 'DR Congo',
    code: 'CD',
    dialCode: '+243',
    format: 'XXX XXX XXX',
    example: '701 234 567'
  },
  // Ethiopia
  {
    name: 'Ethiopia',
    code: 'ET',
    dialCode: '+251',
    format: 'XX XXX XXXX',
    example: '91 123 4567'
  },
  // Somalia
  {
    name: 'Somalia',
    code: 'SO',
    dialCode: '+252',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Sudan
  {
    name: 'Sudan',
    code: 'SD',
    dialCode: '+249',
    format: 'XX XXX XXXX',
    example: '91 123 4567'
  },
  // South Sudan
  {
    name: 'South Sudan',
    code: 'SS',
    dialCode: '+211',
    format: 'XX XXX XXXX',
    example: '91 123 4567'
  },
  // Central African Republic
  {
    name: 'Central African Republic',
    code: 'CF',
    dialCode: '+236',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Cameroon
  {
    name: 'Cameroon',
    code: 'CM',
    dialCode: '+237',
    format: 'XXX XXX XXX',
    example: '701 234 567'
  },
  // Chad
  {
    name: 'Chad',
    code: 'TD',
    dialCode: '+235',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Niger
  {
    name: 'Niger',
    code: 'NE',
    dialCode: '+227',
    format: 'XX XXX XXX',
    example: '91 234 567'
  },
  // Mali
  {
    name: 'Mali',
    code: 'ML',
    dialCode: '+223',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Burkina Faso
  {
    name: 'Burkina Faso',
    code: 'BF',
    dialCode: '+226',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Ivory Coast
  {
    name: 'Ivory Coast',
    code: 'CI',
    dialCode: '+225',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Senegal
  {
    name: 'Senegal',
    code: 'SN',
    dialCode: '+221',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Guinea
  {
    name: 'Guinea',
    code: 'GN',
    dialCode: '+224',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Sierra Leone
  {
    name: 'Sierra Leone',
    code: 'SL',
    dialCode: '+232',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Liberia
  {
    name: 'Liberia',
    code: 'LR',
    dialCode: '+231',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Guinea-Bissau
  {
    name: 'Guinea-Bissau',
    code: 'GW',
    dialCode: '+245',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Cape Verde
  {
    name: 'Cape Verde',
    code: 'CV',
    dialCode: '+238',
    format: 'XXX XXXX',
    example: '123 4567'
  },
  // Mauritania
  {
    name: 'Mauritania',
    code: 'MR',
    dialCode: '+222',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Algeria
  {
    name: 'Algeria',
    code: 'DZ',
    dialCode: '+213',
    format: 'XX XXX XXXX',
    example: '71 234 5678'
  },
  // Tunisia
  {
    name: 'Tunisia',
    code: 'TN',
    dialCode: '+216',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Libya
  {
    name: 'Libya',
    code: 'LY',
    dialCode: '+218',
    format: 'XX XXX XXX',
    example: '91 234 567'
  },
  // Egypt
  {
    name: 'Egypt',
    code: 'EG',
    dialCode: '+20',
    format: 'XX XXX XXXX',
    example: '10 123 4567'
  },
  // Morocco
  {
    name: 'Morocco',
    code: 'MA',
    dialCode: '+212',
    format: 'XX XXX XXXX',
    example: '61 234 5678'
  },
  // Western Sahara
  {
    name: 'Western Sahara',
    code: 'EH',
    dialCode: '+212',
    format: 'XX XXX XXXX',
    example: '61 234 5678'
  },
  // Equatorial Guinea
  {
    name: 'Equatorial Guinea',
    code: 'GQ',
    dialCode: '+240',
    format: 'XXX XXX XXX',
    example: '701 234 567'
  },
  // Gabon
  {
    name: 'Gabon',
    code: 'GA',
    dialCode: '+241',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Republic of Congo
  {
    name: 'Republic of Congo',
    code: 'CG',
    dialCode: '+242',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Angola
  {
    name: 'Angola',
    code: 'AO',
    dialCode: '+244',
    format: 'XXX XXX XXX',
    example: '701 234 567'
  },
  // Zambia
  {
    name: 'Zambia',
    code: 'ZM',
    dialCode: '+260',
    format: 'XX XXX XXXX',
    example: '95 123 4567'
  },
  // Zimbabwe
  {
    name: 'Zimbabwe',
    code: 'ZW',
    dialCode: '+263',
    format: 'XX XXX XXXX',
    example: '71 234 5678'
  },
  // Botswana
  {
    name: 'Botswana',
    code: 'BW',
    dialCode: '+267',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Namibia
  {
    name: 'Namibia',
    code: 'NA',
    dialCode: '+264',
    format: 'XX XXX XXXX',
    example: '61 234 5678'
  },
  // Lesotho
  {
    name: 'Lesotho',
    code: 'LS',
    dialCode: '+266',
    format: 'XX XXX XXX',
    example: '51 234 567'
  },
  // Eswatini
  {
    name: 'Eswatini',
    code: 'SZ',
    dialCode: '+268',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Madagascar
  {
    name: 'Madagascar',
    code: 'MG',
    dialCode: '+261',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Mauritius
  {
    name: 'Mauritius',
    code: 'MU',
    dialCode: '+230',
    format: 'XXX XXXX',
    example: '123 4567'
  },
  // Seychelles
  {
    name: 'Seychelles',
    code: 'SC',
    dialCode: '+248',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Comoros
  {
    name: 'Comoros',
    code: 'KM',
    dialCode: '+269',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Djibouti
  {
    name: 'Djibouti',
    code: 'DJ',
    dialCode: '+253',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Eritrea
  {
    name: 'Eritrea',
    code: 'ER',
    dialCode: '+291',
    format: 'XX XXX XXX',
    example: '71 234 567'
  },
  // Gambia
  {
    name: 'Gambia',
    code: 'GM',
    dialCode: '+220',
    format: 'XXX XXXX',
    example: '123 4567'
  },
  // Togo
  {
    name: 'Togo',
    code: 'TG',
    dialCode: '+228',
    format: 'XX XXX XXX',
    example: '91 234 567'
  },
  // Benin
  {
    name: 'Benin',
    code: 'BJ',
    dialCode: '+229',
    format: 'XX XXX XXX',
    example: '91 234 567'
  }
];

// Default country (Uganda)
export const defaultCountry = countryCodes[0];

// Function to validate phone number based on country format
export const validatePhoneNumber = (phone: string, countryCode: string): boolean => {
  const country = countryCodes.find(c => c.code === countryCode);
  if (!country) return false;
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it matches the expected length for the country
  const expectedLength = country.format.replace(/\D/g, '').length;
  
  return digitsOnly.length === expectedLength;
};

// Function to format phone number based on country format
export const formatPhoneNumber = (phone: string, countryCode: string): string => {
  const country = countryCodes.find(c => c.code === countryCode);
  if (!country) return phone;
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Apply the format
  let formatted = country.format;
  let digitIndex = 0;
  
  for (let i = 0; i < formatted.length && digitIndex < digitsOnly.length; i++) {
    if (formatted[i] === 'X') {
      formatted = formatted.slice(0, i) + digitsOnly[digitIndex] + formatted.slice(i + 1);
      digitIndex++;
    }
  }
  
  return formatted;
};














