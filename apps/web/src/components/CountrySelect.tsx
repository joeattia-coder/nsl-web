type CountrySelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

import { COUNTRY_OPTIONS } from "@/lib/country";

export default function CountrySelect({
  id,
  value,
  onChange,
  className = "admin-select",
  required = false,
  disabled = false,
  placeholder = "Select country",
}: CountrySelectProps) {
  return (
    <select
      id={id}
      className={className}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {COUNTRY_OPTIONS.map((countryOption) => (
        <option key={countryOption} value={countryOption}>
          {countryOption}
        </option>
      ))}
    </select>
  );
}