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
<a href="https://ophoomo.github.io/thai-address-universal/index.html">📄TypeDoc</a>
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
setEngMode (status: boolean): void
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
splitAddress (fullAddress: string): Promise<IExpanded>
```

```typescript
translateWord (word: string): Promise<string>
```

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
