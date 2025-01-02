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

In this project, we have utilized data from the Thai transliteration database provided by [Bangmod.Cloud](https://github.com/bangmodcloud/thai-address-database), which plays a crucial role in the development of this project. I would like to express my sincere gratitude to [Bangmod.Cloud](https://bangmod.cloud/) for their generous contribution of time and resources in creating this dataset. Their support has been invaluable.

## 🛠️Installation

```bash
npm install thai-address-universal --save
```

```javascript
<script src="https://cdn.jsdelivr.net/npm/thai-address-universal/dist/thai-address-universal.umd.min.js"></script>
```
## 👨‍💻Example
```javascript
import { getProvinceAll } from 'thai-address-universal';
const provinces = getProvinceAll();
console.log(provinces);
```
```javascript
<script src="https://cdn.jsdelivr.net/npm/thai-address-universal/dist/thai-address-universal.umd.min.js"></script>
<script>
  const provinces = ThaiAddressUniversal.getProvinceAll();
  console.log(provinces);
</script>
```

## ✨Features

```javascript
setEngMode(status: boolean): void
```

```javascript
getProvinceAll(): string[]
```

```javascript
getAmphoeByProvince (province: string): string[]
```

```javascript
getDistrictByAmphoe (amphoe: string): string[]
```

```javascript
getZipCodeByDistrict (district: string): string[]
```

```javascript
searchAddressByDistrict (searchStr: string, maxResult?: number): IExpanded[]
```

```javascript
searchAddressByAmphoe (searchStr: string, maxResult?: number): IExpanded[]
```

```javascript
searchAddressByProvince (searchStr: string, maxResult?: number): IExpanded[]
```

```javascript
searchAddressByZipcode (searchStr: string | number, maxResult?: number): IExpanded[]
```

```javascript
splitAddress (fullAddress: string): IExpanded
```

## 🤝Contact

📧 For questions or support, please reach out to us at [me@thanaphoom.dev](mailto:me@thanaphoom.dev).

Thank you for using Thai Address Universal!
We hope you find it useful and look forward to your contributions. 🙌
