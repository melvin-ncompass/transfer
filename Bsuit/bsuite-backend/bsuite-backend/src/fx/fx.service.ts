import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import axios from "axios";
import { FxConversionDto } from "./dto/fx-conversion.dto";
import { FxRateDto } from "./dto/fx-rate.dto";

interface CachedApiResponse {
  etag: string;
  date: string;
  data: any;
}

@Injectable()
export class FxService {
  constructor(@Inject("REDIS_CACHE") private cacheManager: Cache) {
    console.log("IS GET A FUNCTION?", typeof cacheManager.get === "function");
  }

  private async fetchHistorical(from: string, to: string, date: string) {
    const today = new Date().toISOString().split("T")[0];
    const targetDate = date > today ? "latest" : date;

    const cacheKey = `fx_${targetDate}_${from}_${to}`;
    const cachedResponse =
      await this.cacheManager.get<CachedApiResponse>(cacheKey);

    const url = `${process.env.FIXER_DOMAIN}${targetDate}`;
    const params = {
      access_key: process.env.FIXER_API_KEY,
      base: from,
      symbols: to,
    };

    const headers: Record<string, string> = {};
    if (cachedResponse) {
      headers["If-None-Match"] = cachedResponse.etag;
      headers["If-Modified-Since"] = cachedResponse.date;
    }

    try {
      const response = await axios.get(url, {
        params,
        headers,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 304) {
        if (!cachedResponse) {
          throw new InternalServerErrorException("Cache synchronization error");
        }
        return cachedResponse.data;
      }

      if (response.status === 200) {
        const result = {
          etag: response.headers["etag"] as string,
          date: response.headers["date"] as string,
          data: response.data,
        };
        await this.cacheManager.set(cacheKey, result, 0);
        return response.data;
      }

      throw new Error("API Error");
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException(`Failed to fetch data`);
    }
  }

  async history(fxRateDto: FxRateDto): Promise<any> {
    const { from, to, date } = fxRateDto;
    const fromCurrencies = from.includes(',')
      ? from.split(',').map(v => v.trim())
      : [from];

    const results = await Promise.all(
      fromCurrencies.map(async (base) => {
        const data = await this.fetchHistorical(base, to, date);
        return [base, data.rates[to]]
      })
    );

    return {
      from: fromCurrencies,
      to: to,
      rate: Object.fromEntries(results)
    };
  }


  async conversion(fxConversionDto: FxConversionDto): Promise<any> {
    const { from, to, date, amount } = fxConversionDto;
    const data = await this.fetchHistorical(from, to, date);
    const rate = data.rates[to];
    return {
      from,
      to,
      amount,
      rate,
      result: amount * rate,
      date: data.date,
    };
  }
}