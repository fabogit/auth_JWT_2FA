import {
	BadRequestException,
	Body,
	Request,
	Response,
	Controller,
	NotFoundException,
	Post,
	Get,
	UnauthorizedException,
} from '@nestjs/common';
// import * as bcrypt from "bcrypt";
import { hash, compare } from 'bcrypt';
import { Request as Req, Response as Res } from 'express';

import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';

@Controller()
export class UserController {
	constructor(
		private userService: UserService,
		private jwtService: JwtService,
	) { }

	/**
	 * Create a new user in the db
	 * @param body
	 * @returns
	 */
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

	/**
	 * Log the user in and returns a jwt access token in the body response and a refresh token via cookies
	 * @param email user email
	 * @param password user password
	 * @param response Body response
	 */
	@Post('login')
	async login(
		@Body('email') email: string,
		@Body('password') password: string,
		@Response({ passthrough: true }) response: Res,
	) {
		const user = await this.userService.findOne({ where: { email } });
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

		response.cookie('refresh_token', refreshToken, {
			// helps mitigate the risk of client-side scripts accessing the protected cookie
			// cookie cannot be accessed through the client-side script
			httpOnly: true,
			//  1week
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});
		response.status(200);
		return { token: accessToken };
	}

	/**
	 * Return the current logged in user using the jwt in the headers
	 * @param request
	 * @returns
	 */
	@Get('user')
	async currentUser(@Request() request: Req) {
		try {
			// get access token from headers and verify the jwt
			const accessToken = request.headers.authorization.replace('Bearer ', '');
			const { id } = await this.jwtService.verifyAsync(accessToken);
			const { password, ...currentUser } = await this.userService.findOne({
				where: { id },
			});
			return currentUser;
		} catch (error) {
			throw new UnauthorizedException();
		}
	}

	@Post('refresh')
	async refreshToken(
		@Request() request: Req,
		@Response({ passthrough: true }) response: Res,
	) {
		try {
			const refreshToken = request.cookies['refresh_token'];
			const { id } = await this.jwtService.verifyAsync(refreshToken);
			const newToken = await this.jwtService.signAsync(
				{ id },
				{ expiresIn: '30s' },
			);
			response.status(200)
			return { token: newToken };
		} catch (error) {
			throw new UnauthorizedException();
		}
	}
}
