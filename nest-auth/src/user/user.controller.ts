import {
	BadRequestException,
	Body,
	Response,
	Controller,
	NotFoundException,
	Post,
} from '@nestjs/common';
// import * as bcrypt from "bcrypt";
import { hash, compare } from 'bcrypt';
import { Response as Res } from 'express';

import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';

@Controller('api')
export class UserController {
	constructor(
		private userService: UserService,
		private jwtService: JwtService,
	) { }

	// TODO type body
	@Post('register')
	async register(@Body() body: any) {
		if (body.password !== body.password_confirm) {
			throw new BadRequestException('Passwords do not match');
		}
		return this.userService.save({
			first_name: body.first_name,
			last_name: body.last_name,
			email: body.email,
			password: await hash(body.password, 12),
		});
	}

	@Post('login')
	async login(
		@Body('email') email: string,
		@Body('password') password: string,
		@Response({ passthrough: true }) response: Res,
	) {
		const user = await this.userService.findOne(email);
		if (!user) {
			throw new NotFoundException('User not found');
		}

		const isPasswordCorrect = await compare(password, user.password);
		if (!isPasswordCorrect) {
			throw new BadRequestException('Invalid credentials');
		}

		const accessToken = await this.jwtService.signAsync(
			{ id: user.id },
			{ expiresIn: '30s' },
		);
		const refreshToken = await this.jwtService.signAsync({ id: user.id });

		response.cookie('refreshToken', refreshToken, {
			// helps mitigate the risk of client-side scripts accessing the protected cookie
			// cookie cannot be accessed through the client-side script
			httpOnly: true,
			//  1week
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		return { token: accessToken };
	}
}
