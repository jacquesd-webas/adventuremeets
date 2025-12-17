import { ApiProperty } from '@nestjs/swagger';

export class UserProfile {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ type: [String] })
  roles: string[];

  @ApiProperty({ type: [String] })
  studios: string[];

  @ApiProperty({
    required: false,
    type: 'object',
    properties: {
      isSuperuser: { type: 'boolean' },
      users: { type: 'string' },
      studios: { type: 'string' },
      roles: { type: 'string' },
      games: { type: 'string' },
    },
  })
  permissions?: {
    isSuperuser: boolean;
    users: string;
    studios: string;
    roles: string;
    games: string;
  };

  constructor() {
    this.roles = [];
    this.studios = [];
  }

  // Internal use only; not exposed in /me response.
  passwordHash?: string;
}
