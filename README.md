<p align="center">
  <img src="https://github.com/ophoomo/thai-address-universal/raw/master/thai-address-universal.svg" width="100%" />
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/thai-address-universal">
    <img src="https://img.shields.io/npm/v/thai-address-universal" alt="NPM Version">
    </a>
    <a href="https://github.com/ophoomo/thai-address-universal/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/ophoomo/thai-address-universal/publish.yaml" alt="GitHub Actions Workflow Status">
    </a>
    <a href="https://codecov.io/github/ophoomo/thai-address-universal/graph/badge.svg?token=POBBK8A3FD">
    <img src="https://codecov.io/github/ophoomo/thai-address-universal/graph/badge.svg?token=POBBK8A3FD" alt="codecov">
    </a>
</p>

Thai Address Universal is a library developed from [thai-address-database](https://github.com/Sellsuki/thai-address-database), rewritten to fully support usage with TypeScript 🖥️✨. This allows for efficient use and ensures accurate type-checking ✅.

This library includes various functions that assist in searching for address data in Thailand 🇹🇭 from multiple types, and it can also extract address information from a full address string conveniently and accurately 🏠🔍.

<p align="center">
<a href="https://ophoomo.github.io/thai-address-universal/">📄 Documentation</a>
</p>

## 🛠️ Installation

```bash
npm install thai-address-universal --save
```

```html
<script src="https://cdn.jsdelivr.net/npm/thai-address-universal/dist/umd/index.js"></script>
```

## 👨‍💻 Example

```typescript
import { getProvinceAll } from 'thai-address-universal';
const getProvince = async () => {
    const provinces = await getProvinceAll();
    console.log(provinces);
};
getProvince();
```

```html
<script src="https://cdn.jsdelivr.net/npm/thai-address-universal/dist/umd/index.js"></script>
<script>
    const getProvince = async () => {
        const provinces = await ThaiAddressUniversal.getProvinceAll();
        console.log(provinces);
    };
    getProvince();
</script>
```

## ✨ Features

```typescript
getDatabase (): IExpanded[]
```

```typescript
getGeoMode (): boolean
```

```typescript
setGeoMode (status: boolean): Promise<void>
```

```typescript
getEngMode (): boolean
```

```typescript
setEngMode (status: boolean): Promise<void>
```

```typescript
getProvinceAll (): Promise<string[]>
```

```typescript
getDistrictByProvince (province: string): Promise<string[]>
```

```typescript
getSubDistrictByDistrict (district: string): Promise<string[]>
```

```typescript
getPostalCodeBySubDistrict (sub_district: string): Promise<string[]>
```

```typescript
searchAddressByProvince (searchStr: string, maxResult?: number): Promise<IExpanded[]>
```

```typescript
searchAddressByDistrict (searchStr: string, maxResult?: number): Promise<IExpanded[]>
```

```typescript
searchAddressBySubDistrict (searchStr: string, maxResult?: number): Promise<IExpanded[]>
```

```typescript
searchAddressByPostalCode (searchStr: string | number, maxResult?: number): Promise<IExpanded[]>
```

```typescript
splitAddress (fullAddress: string): Promise<IExpanded | null>
```

```typescript
translateWord (word: string): Promise<string>
```

## 🆕 New in v2.2.0

### Structured directory

Returns entries carrying **both languages and the official geocode**
(`AddressEntry = { nameTh, nameEn, code, postalCode? }`), independent of the
global `setEngMode` / `setGeoMode` switches. Every function accepts the
parent's Thai name, English name, or numeric code.

```typescript
getProvinces (): Promise<AddressEntry[]>
```

All 77 provinces — e.g. `{ nameTh: 'เชียงใหม่', nameEn: 'Chiang Mai', code: '50' }`.

```typescript
getDistricts (province: string): Promise<AddressEntry[]>
```

Districts of `province` (given as a name in either language, or a 2-digit code).

```typescript
getSubDistricts (district: string): Promise<AddressEntry[]>
```

Sub-districts of `district`, each including its `postalCode`.

```typescript
getByGeocode (code: string): Promise<AddressEntry | null>
```

Looks up a single unit by its exact geocode; the length of `code` (2 / 4 / 6)
selects the level. `null` for an unknown code.

### Validation

```typescript
validateAddress (
    input: { province?; district?; subDistrict?; postalCode? },
    options?: { language?: 'thai' | 'eng' },
): Promise<{ valid: boolean; errors: Record<string, string>; match?: IExpanded }>
```

Checks that the given parts exist **and belong together** (a district that sits
in the province, a postal code that serves the sub-district, …). Only the
fields you pass are checked, so it works on a partially filled form; the chain
stops at the first inconsistent field and names it in `errors`.

```typescript
await validateAddress({ province: 'เชียงใหม่', district: 'หาดใหญ่' });
// { valid: false, errors: { district: 'District "หาดใหญ่" is not in province "เชียงใหม่"' } }
```

### Formatting

```typescript
formatAddress (
    parts: { address?; subDistrict?; district?; province?; postalCode? },
    options?: { language?: 'thai' | 'eng'; prefix?: boolean; separator?: string },
): string
```

The inverse of `splitAddress` — assembles one address string (synchronous, no
data load). Blank parts are skipped; Bangkok automatically switches to
แขวง / เขต and drops the province word.

```typescript
formatAddress({
    address: '99/9',
    subDistrict: 'ศรีภูมิ',
    district: 'เมืองเชียงใหม่',
    province: 'เชียงใหม่',
    postalCode: '50200',
});
// "99/9 ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200"
```

### Warm-up

```typescript
preload (options?: { language?: 'thai' | 'eng' | 'both'; geo?: boolean }): Promise<void>
```

Fetches the data chunks ahead of time so the first real lookup does not wait on
the network. Never changes the active language or geo mode — e.g. call it when
an address form mounts.

> Full per-symbol API reference (generated from the source): <https://ophoomo.github.io/thai-address-universal/>
> — see also [`llms.txt`](./llms.txt) for a condensed, example-heavy overview.

## 🙏 Acknowledgements

I would like to extend my deepest thanks to:

- **Sellsuki** [thai-address-database](https://github.com/Sellsuki/thai-address-database)

- **Bangmod Cloud** [thai-address-database](https://github.com/bangmodcloud/thai-address-database)

- **Earthchie** [jquery.Thailand.js](https://github.com/earthchie/jquery.Thailand.js/)

Your contributions, whether big or small, have made this project what it is today. Thank you for your support and inspiration! 🎉

## 🤝 Contact

📧 For questions or support, please reach out to us at [me@thanaphoom.dev](mailto:me@thanaphoom.dev).

Thank you for using Thai Address Universal!
We hope you find it useful and look forward to your contributions. 🙌
