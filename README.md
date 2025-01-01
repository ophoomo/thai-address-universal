# Thai Address Universal

Thai Address Universal is a library developed from [thai-address-database](https://github.com/Sellsuki/thai-address-database), rewritten to fully support usage with TypeScript 🖥️✨. This allows for efficient use and ensures accurate type-checking ✅.

This library includes various functions that assist in searching for address data in Thailand 🇹🇭 from multiple types, and it can also extract address information from a full address string conveniently and accurately 🏠🔍.

## 🛠️Installation

```bash
npm install thai-address-universal --save
```

## ✨Features

```javascript
searchAddressByDistrict( searchStr: string, maxResult?: number): IExpanded[]
```

```javascript
searchAddressByAmphoe ( searchStr: string, maxResult?: number): IExpanded[]
```

```javascript
searchAddressByProvince ( searchStr: string, maxResult?: number): IExpanded[]
```

```javascript
searchAddressByZipcode ( searchStr: string | number, maxResult?: number): IExpanded[]
```

```javascript
splitAddress (fullAddress: string): IExpanded
```

## 🤝Contact

📧 For questions or support, please reach out to us at [me@thanaphoom.dev](mailto:me@thanaphoom.dev).

Thank you for using Thai Address Universal!
We hope you find it useful and look forward to your contributions. 🙌
