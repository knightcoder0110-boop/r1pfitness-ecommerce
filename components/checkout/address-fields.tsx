"use client";

import { Field, SelectField } from "./field";
import type { AddressInput } from "@/lib/checkout/types";

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

type Errors = Partial<Record<keyof AddressInput, string>>;

interface AddressFieldsProps {
  /** Fieldset legend label, e.g. "Billing Address". */
  legend: string;
  /** Prefix for field name attributes, e.g. "billing" → billing.firstName. */
  prefix: string;
  defaultValues?: Partial<AddressInput>;
  errors?: Errors;
}

export function AddressFields({ legend, prefix, defaultValues, errors }: AddressFieldsProps) {
  return (
    <fieldset className="border border-border p-5 sm:p-6">
      <legend className="px-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
        {legend}
      </legend>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="First Name"
          name={`${prefix}.firstName`}
          defaultValue={defaultValues?.firstName}
          error={errors?.firstName}
          autoComplete="given-name"
          required
        />
        <Field
          label="Last Name"
          name={`${prefix}.lastName`}
          defaultValue={defaultValues?.lastName}
          error={errors?.lastName}
          autoComplete="family-name"
          required
        />
        <Field
          label="Address"
          name={`${prefix}.line1`}
          defaultValue={defaultValues?.line1}
          error={errors?.line1}
          autoComplete="address-line1"
          placeholder="Street address"
          wide
          required
        />
        <Field
          label="Apt / Suite"
          name={`${prefix}.line2`}
          defaultValue={defaultValues?.line2}
          error={errors?.line2}
          autoComplete="address-line2"
          placeholder="Optional"
          wide
        />
        <Field
          label="City"
          name={`${prefix}.city`}
          defaultValue={defaultValues?.city}
          error={errors?.city}
          autoComplete="address-level2"
          required
        />
        <SelectField
          label="State"
          name={`${prefix}.region`}
          defaultValue={defaultValues?.region ?? "HI"}
          error={errors?.region}
          autoComplete="address-level1"
          options={US_STATES}
          required
        />
        <Field
          label="ZIP Code"
          name={`${prefix}.postalCode`}
          defaultValue={defaultValues?.postalCode}
          error={errors?.postalCode}
          autoComplete="postal-code"
          inputMode="numeric"
          maxLength={10}
          required
        />
        <Field
          label="Phone"
          name={`${prefix}.phone`}
          defaultValue={defaultValues?.phone}
          error={errors?.phone}
          autoComplete="tel"
          type="tel"
        />
      </div>
    </fieldset>
  );
}
