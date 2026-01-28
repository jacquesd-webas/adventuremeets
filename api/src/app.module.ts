import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { MeetsModule } from './meets/meets.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { EmailModule } from './email/email.module';
import { TypesModule } from './types/types.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    HealthModule,
    DatabaseModule,
    MeetsModule,
    OrganizationsModule,
    EmailModule,
    TypesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    }
  ],
})
export class AppModule {}
