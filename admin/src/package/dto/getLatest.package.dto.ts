import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetLatestPackageDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: "app包名", example: "main" })
  appName: string;
}
