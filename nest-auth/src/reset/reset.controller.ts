import {
	Controller,
	Body,
	Post,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';

import { MailerService } from '@nestjs-modules/mailer';
import { ResetService } from './services/reset.service';
import { UserService } from 'src/user/services/user.service';

import { hash } from 'bcrypt';



@Controller()
export class ResetController {
	constructor(
		private resetService: ResetService,
		private mailerService: MailerService,
		private userService: UserService,
	) { }

	/**
	 * Initiate the password reset process by sending a reset link to the user's email.
	 *
	 * @param email The email address of the user requesting the password reset.
	 * @returns A success message indicating that the reset link has been sent to the user's email.
	*/
	@Post('forgot')
	async forgot(@Body('email') email: string) {
		const token = Math.random().toString(20).substring(2, 12);
		await this.resetService.save({
			email,
			token,
		});

		// frontend url
		const url = `http:localhost:3000/reset/${token}`;
		await this.mailerService.sendMail({
			to: email,
			subject: 'Reset your password',
			html: `Click <a href="${url}">here</> to reset your password!`,
		});

		return { message: 'Mail sent, check your email!' };
	}

	/**
	 * Reset user password with a valid token.
	 *
	 * @param token The reset token sent to the user's email.
	 * @param password The new password to be set.
	 * @param passwordConfirm Confirmation of the new password.
	 * @returns A success message indicating the password reset was successful.
	 * @throws If the provided passwords do not match.
	 * @throws If the user associated with the provided token is not found.
	*/
	@Post('reset')
	async reset(
		@Body('token') token: string,
		@Body('password') password: string,
		@Body('passwordConfirm') passwordConfirm: string,
	) {
		if (password !== passwordConfirm) {
			throw new BadRequestException('Passwords do not match!');
		}

		const reset = await this.resetService.findOne({ where: { token } });
		if (!reset) {
			throw new NotFoundException('Token not found');
		}
		const user = await this.userService.findOne({
			where: { email: reset.email },
		});
		if (!user) {
			throw new NotFoundException('User not found');
		}

		await this.userService.update(user.id, {
			password: await hash(password, 12),
		});

		return {
			message: 'Succes, new password updated',
		};
	}
}
