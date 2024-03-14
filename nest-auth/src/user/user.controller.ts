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
	Delete,
} from '@nestjs/common';

import { hash, compare } from 'bcrypt';
import { MoreThanOrEqual } from 'typeorm';
import { Request as Req, Response as Res } from 'express';

import { JwtService } from '@nestjs/jwt';
import { UserService } from './services/user.service';
import { TokenService } from './services/token.service';

@Controller()
export class UserController {
	constructor(
		private jwtService: JwtService,
		private userService: UserService,
		private tokenService: TokenService,
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
	 * Sign acces and refresh jwt, save the refresh token in the db.
	 * Return the access token in the body response and set the a refresh_token cookie
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

		// Sign jwt for the user
		const accessToken = await this.jwtService.signAsync(
			{ id: user.id },
			{ expiresIn: '30s' },
		);
		const refreshToken = await this.jwtService.signAsync({ id: user.id });

		// Save the refresh token in the db and set expiration to 1week
		const oneWeek = new Date();
		oneWeek.setDate(oneWeek.getDate() + 7);
		await this.tokenService.save({
			user_id: user.id,
			refresh_token: refreshToken,
			expired_at: oneWeek,
		});

		// Set refresh_token cookie and retun access token
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
	 * Verify the access token in the request headers and return the current logged in user
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

	/**
	 * Verify the refresh token in the cookies is valid,
	 * check in the db if is not expired and sign a new jwt access token
	 * @param request
	 * @param response
	 * @returns
	 */
	@Post('refresh')
	async refreshToken(
		@Request() request: Req,
		@Response({ passthrough: true }) response: Res,
	) {
		try {
			const refreshToken = request.cookies['refresh_token'];
			const { id } = await this.jwtService.verifyAsync(refreshToken);

			const oldRefreshToken = await this.tokenService.findOne({
				where: {
					user_id: id,
					expired_at: MoreThanOrEqual(new Date()),
				},
			});

			if (!oldRefreshToken) {
				throw new UnauthorizedException();
			}

			const newToken = await this.jwtService.signAsync(
				{ id },
				{ expiresIn: '30s' },
			);
			response.status(200);
			return { token: newToken };
		} catch (error) {
			throw new UnauthorizedException();
		}
	}

	/**
	 * Remove the refresh_token cookie and revoke all user refresh tokens
	 * @param response
	 * @returns
	 */
	@Delete('logout')
	async logout(
		@Request() request: Req,
		@Response({ passthrough: true }) response: Res,
	) {
		try {
			const refreshToken = request.cookies['refresh_token'];
			const { id } = await this.jwtService.verifyAsync(refreshToken);
			await this.tokenService.delete({ user_id: id });
			response.clearCookie('refresh_token');
			response.status(202);
			return {
				message: 'Logged out',
			};
		} catch (error) {
			throw new UnauthorizedException();
		}
	}
}
