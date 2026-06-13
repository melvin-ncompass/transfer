import { Controller, Post, Body, Get, UseGuards, Query } from "@nestjs/common";
import { FxService } from "./fx.service";
import { FxRateDto } from "./dto/fx-rate.dto";
import { FxConversionDto } from "./dto/fx-conversion.dto";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { CompanyGuard } from "src/common/guard/company.guard";

@Controller("fx")
@UseGuards(JwtAuthGuard, CompanyGuard)
export class FxController {
  constructor(private readonly fxService: FxService) { }

  @Get("history")
  async history(@Query() fxRateDto: FxRateDto) {
    return {
      message: "Exchange rate retrieved successfully",
      data: await this.fxService.history(fxRateDto),
    };
  }

  @Get("conversion")
  async conversion(@Query() fxConversionDto: FxConversionDto) {
    const result = await this.fxService.conversion(fxConversionDto);
    return {
      message: "Conversion completed successfully",
      data: result,
    };
  }
}