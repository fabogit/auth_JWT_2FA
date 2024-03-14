import { Controller, Body, Post } from '@nestjs/common';

import { ResetService } from './services/reset.service';

@Controller()
export class ResetController {
	constructor(private resetService: ResetService) { }

	@Post('forgot')
	async forgot(@Body('email') email: string) {
		const token = Math.random().toString(20).substring(2, 12);
		await this.resetService.save({
			email,
			token,
		});
		return { message: 'Success' };
	}
}
