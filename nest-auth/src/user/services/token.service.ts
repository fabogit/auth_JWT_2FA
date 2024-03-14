import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Token } from '../entities/token.entity';

@Injectable()
export class TokenService {
	constructor(
		@InjectRepository(Token)
		protected readonly tokenRepository: Repository<Token>,
	) { }

	async save(body: any) {
		return this.tokenRepository.save(body, {});
	}

	async findOne(options: any) {
		return this.tokenRepository.findOne(options);
	}

	async delete(options: any) {
		return this.tokenRepository.delete(options);
	}
}
