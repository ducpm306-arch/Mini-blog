import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'nguyenvan' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiProperty({ example: 'BlogPassword123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto extends RegisterDto {}
