import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';

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
	],
})
export class AppModule { }
