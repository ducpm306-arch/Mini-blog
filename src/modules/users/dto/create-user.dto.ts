import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RegisterDto } from '../../../dto/auth.dto.js';
import { Role } from '../../../global/globalEnum.js';

export class CreateUserDto extends RegisterDto {
  @ApiPropertyOptional({ enum: Role, default: Role.USER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
