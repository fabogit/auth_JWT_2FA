import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import * as bcryptjs from "bcryptjs";

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
			throw new BadRequestException('Password does not match');
		}
		return this.userService.save({
			first_name: body.first_name,
			last_name: body.last_name,
			email: body.email,
			password: await bcryptjs.hash(body.password, 12),
		});
	}
}
