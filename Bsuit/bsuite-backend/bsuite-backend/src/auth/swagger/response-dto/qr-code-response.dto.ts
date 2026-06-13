import { ApiProperty } from "@nestjs/swagger";

export class QrCodeDto {
  @ApiProperty({ example: 'data:image/png;base64,iVBOR...' })
  qrCode: string;
}