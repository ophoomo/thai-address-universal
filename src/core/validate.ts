import { LANGUAGE, type Language } from '../constants';
import type { IExpanded } from '../types/thai-address';
import { DatabaseFactory } from './database';

/** The address a caller wants checked. Every field is optional. */
export interface AddressInput {
    province?: string;
    district?: string;
    subDistrict?: string;
    postalCode?: string | number;
}

/** Fields {@link validateAddress} can report an error against. */
export type AddressField = keyof AddressInput;

/** Outcome of {@link validateAddress}. */
export interface AddressValidationResult {
    /** `true` when every provided field is mutually consistent. */
    valid: boolean;
    /** A message per field that broke the chain (usually zero or one entry). */
    errors: Partial<Record<AddressField, string>>;
    /** The dataset row that satisfies every provided field, when `valid`. */
    match?: IExpanded;
}

/** Options for {@link validateAddress}. */
export interface ValidateAddressOptions {
    /** Dataset language the names are in. Defaults to Thai. */
    language?: Language;
}

/** A required, always-present column of {@link IExpanded}. */
type RequiredColumn = 'province' | 'district' | 'sub_district' | 'postal_code';

/** Field order + the row column each input field maps to. */
const CHAIN: {
    input: AddressField;
    column: RequiredColumn;
    label: string;
}[] = [
    { input: 'province', column: 'province', label: 'province' },
    { input: 'district', column: 'district', label: 'district' },
    { input: 'subDistrict', column: 'sub_district', label: 'sub-district' },
    { input: 'postalCode', column: 'postal_code', label: 'postal code' },
];

const normalise = (value: string | number): string =>
    value.toString().trim().toLowerCase();

/**
 * Checks that the parts of an address exist and belong together — a valid
 * province, a district that sits in it, a sub-district that sits in the
 * district, and a postal code that serves that sub-district.
 *
 * Only the fields you pass are checked, so it works for a partially filled
 * form. The chain stops at the first inconsistent field and names it in
 * `errors`.
 *
 * @example
 * await validateAddress({
 *   province: 'เชียงใหม่',
 *   district: 'เมืองเชียงใหม่',
 *   subDistrict: 'ศรีภูมิ',
 *   postalCode: '50200',
 * });
 * // { valid: true, errors: {}, match: { ... } }
 *
 * @example
 * await validateAddress({ province: 'เชียงใหม่', district: 'หาดใหญ่' });
 * // { valid: false, errors: { district: 'District "หาดใหญ่" is not in province "เชียงใหม่"' } }
 */
export const validateAddress = async (
    input: AddressInput,
    options: ValidateAddressOptions = {},
): Promise<AddressValidationResult> => {
    const provided = CHAIN.filter(({ input: field }) => {
        const value = input[field];
        return value !== undefined && value.toString().trim() !== '';
    });

    if (provided.length === 0) {
        return { valid: false, errors: {} };
    }

    const database = await DatabaseFactory.createDatabase(
        options.language ?? LANGUAGE.THAI,
    );

    let rows = database.getData();
    let previousLabel = '';
    let previousValue = '';

    for (const { input: field, column, label } of provided) {
        const needle = normalise(input[field] as string | number);
        const next = rows.filter((row) => normalise(row[column]) === needle);

        if (next.length === 0) {
            const raw = String(input[field]);
            const message =
                previousLabel === ''
                    ? `Unknown ${label} "${raw}"`
                    : `${label[0].toUpperCase()}${label.slice(1)} "${raw}" is not in ${previousLabel} "${previousValue}"`;
            return { valid: false, errors: { [field]: message } };
        }

        rows = next;
        previousLabel = label;
        previousValue = String(input[field]);
    }

    return { valid: true, errors: {}, match: rows[0] };
};
