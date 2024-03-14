import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from './entities/user.entity';
import { Token } from './entities/token.entity';
import { UserController } from './user.controller';
import { UserService } from './services/user.service';
import { TokenService } from './services/token.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, Token]),
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
	providers: [UserService, TokenService]
})
export class UserModule { }
