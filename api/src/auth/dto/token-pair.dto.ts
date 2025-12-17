import { ApiProperty } from '@nestjs/swagger';

export class TokenPair {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}
