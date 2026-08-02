import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CapturesModule } from './captures/captures.module';
import { DiscoveriesModule } from './discoveries/discoveries.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfessorsModule } from './professors/professors.module';
import { SeedModule } from './seed/seed.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ProfessorsModule,
    DiscoveriesModule,
    CapturesModule,
    SeedModule,
  ],
})
export class AppModule {}
