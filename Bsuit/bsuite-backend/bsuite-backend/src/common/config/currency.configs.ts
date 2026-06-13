import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const filePath = process.env.CURRENCY_JSON_PATH;

if (!filePath) throw new Error("CURRENCY_JSON_PATH missing in .env");

const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

export const CURRENCY_VALUES = data.map(item => `${item.symbol} - ${item.cc}`);

export const CURRENCY_CC_NAME = data.map(item => ({
  cc: item.cc,
  name: item.name,
  symbol: item.symbol
}));
