import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePackageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(10, { message: '不能超过10个字' })
  @ApiProperty({ description: "模块名称", example: "" })
  moduleName: string;
  
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: "版本", example: "1.0" })
  version: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(150, { message: '不能超过150个字' })
  @ApiProperty({ description: "更新日志", example: "最初版" })
  updateLog: string;
}