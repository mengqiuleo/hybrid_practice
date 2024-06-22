import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// 获取离线包列表DTO
export class QueryPackageDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: "页码(第几页)", example: 2 }) // 参数描述及举例
  @Type(() => Number)  // Ensure the string is transformed to a number
  page: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: "页数(每页有几条数据)", example: 10 })
  @Type(() => Number)  // Ensure the string is transformed to a number
  size: number;

  
  @IsString()
  @MaxLength(10, { message: '不能超过10个字' })
  @IsOptional()
  @ApiProperty({ description: "模块名称", example: "", required: false })
  moduleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: '不能超过10个字' })
  @ApiProperty({ description: "APP名称", example: "", required: false })
  appName?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: "状态", example: 0, required: false })
  status?: number;
}
