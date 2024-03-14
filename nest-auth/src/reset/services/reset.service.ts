import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Reset } from '../entities/reset.entity';

@Injectable()
export class ResetService {
	constructor(
		@InjectRepository(Reset)
		private readonly resetRepository: Repository<Reset>,
	) { }

	async save(body: any) {
		return this.resetRepository.save(body, {});
	}
}
