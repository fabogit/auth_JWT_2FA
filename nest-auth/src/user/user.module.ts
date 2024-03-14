import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
	imports: [
		TypeOrmModule.forFeature([User]),
		JwtModule.register({
			// global: true,
			secret: 'jwtConstants.secret',
			signOptions: {
				// refreshToken duration
				expiresIn: '1w'
			},
		}),
	],
	controllers: [UserController],
	providers: [UserService]
})
export class UserModule { }
