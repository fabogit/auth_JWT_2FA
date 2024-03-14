import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';

import { Reset } from './entities/reset.entity';
import { ResetController } from './reset.controller';
import { ResetService } from './services/reset.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reset]),
    MailerModule.forRoot({
      transport: {
        // mailhog [SMTP] Binding to address value
        host: '0.0.0.0',
        port: 1025,
      },
      defaults: {
        from: 'from@example.com',
      },
    }),
  ],
  providers: [ResetService],
  controllers: [ResetController],
})
export class ResetModule { }
