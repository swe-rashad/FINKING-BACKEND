import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';
import { GetStatisticsDto } from './get-statistics.dto';

export class ExportStatisticsDto extends GetStatisticsDto {
  @ApiPropertyOptional({ example: 'admin@finking.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
