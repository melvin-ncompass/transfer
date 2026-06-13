import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

export enum CurrencyEnum {}
const filePath = process.env.CURRENCY_JSON_PATH;
if (!filePath) throw new Error("CURRENCY_JSON_PATH missing in .env");
const currencyData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
currencyData.forEach(currency => {
  CurrencyEnum[`${currency.symbol} - ${currency.cc}`] = `${currency.symbol} - ${currency.cc}`;
});
export const CurrencyEnumValues = Object.values(CurrencyEnum);
