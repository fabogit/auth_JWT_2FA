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

import { JwtService } from '@nestjs/jwt';
import { UserService } from './services/user.service';
import { TokenService } from './services/token.service';

import { hash, compare } from 'bcrypt';
import { MoreThanOrEqual } from 'typeorm';
import { Request as Req, Response as Res } from 'express';

@Controller()
export class UserController {
	constructor(
		private jwtService: JwtService,
		private userService: UserService,
		private tokenService: TokenService,
	) { }

	/**
	 * Register a new user with the provided details.
	 *
	 * @param body The request body containing user registration details.
	 * @param body.first_name The first name of the user to be registered.
	 * @param body.last_name The last name of the user to be registered.
	 * @param body.email The email address of the user to be registered.
	 * @param body.password The password chosen by the user for registration.
	 * @param body.password_confirm Confirmation of the password chosen by the user.
	 * @returns  A promise resolving to the saved user object upon successful registration.
	 * @throws If the provided passwords do not match.
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
	 * Authenticate a user by their email and password and generate access and refresh tokens.
	 *
	 * @param email The email address of the user attempting to log in.
	 * @param password The password provided by the user for authentication.
	 * @param response The response object to set the refresh token cookie and status.
	 * @returns A promise resolving to an object containing the access token for the authenticated user.
	 * @throws If the user with the provided email is not found.
	 * @throws If the provided password does not match the user's password.
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
	 * Verify the access token in the request headers and return the current logged in user.
	 *
	 * @param request - The request object containing headers for authentication.
	 * @returns A promise resolving to an object containing details of the authenticated user.
	 * @throws If the request is unauthorized or authentication fails.
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
	 * Refresh the access token using the provided refresh token.
	 *
	 * @param request - The request object containing the refresh token cookie.
	 * @param response - The response object to set the new access token.
	 * @returns A promise resolving to an object containing the new access token.
	 * @throws If the refresh token is invalid or expired.
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
	 * Log out the currently authenticated user by deleting their refresh tokens.
	 *
	 * @param request - The request object containing the refresh token cookie.
	 * @param response - The response object to clear the refresh token cookie and set status.
	 * @returns An object with a success message indicating successful logout.
	 * @throws If the request is unauthorized or authentication fails.
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
