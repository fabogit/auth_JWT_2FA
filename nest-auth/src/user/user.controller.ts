import { BadRequestException, Body, Controller, NotFoundException, Post } from '@nestjs/common';
// import * as bcrypt from "bcrypt";
import { hash, compare } from "bcrypt";

import { UserService } from './user.service';

@Controller('api')
export class UserController {
	constructor(
		private userService: UserService
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
	) {
		const user = await this.userService.findOne(email);
		if (!user) {
			throw new NotFoundException('User not found');
		}

		const isPasswordCorrect = await compare(password, user.password);
		if (!isPasswordCorrect) {
			throw new BadRequestException('Invalid credentials');
		}

		return user;
	}

}
