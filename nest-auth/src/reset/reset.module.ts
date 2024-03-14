import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Reset } from './entities/reset.entity';
import { ResetController } from './reset.controller';
import { ResetService } from './services/reset.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reset])],
  providers: [ResetService],
  controllers: [ResetController],
})
export class ResetModule { }
