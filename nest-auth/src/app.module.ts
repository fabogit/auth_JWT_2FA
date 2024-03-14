import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from './user/user.module';
import { ResetModule } from './reset/reset.module';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'mysql',
			host: 'localhost',
			port: 3309,
			username: 'user',
			password: 'password',
			database: 'auth',
			autoLoadEntities: true,
			// entities: [User],
			synchronize: true,
		}),
		UserModule,
		ResetModule,
	],
})
export class AppModule { }
