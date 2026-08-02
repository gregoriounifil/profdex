import { Module } from '@nestjs/common';
import { DiscoveriesController } from './discoveries.controller';
import { DiscoveriesService } from './discoveries.service';

@Module({
  controllers: [DiscoveriesController],
  providers: [DiscoveriesService],
})
export class DiscoveriesModule {}
