import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User) protected readonly userRepository: Repository<User>,
	) { }

	async save(body: any) {
		return this.userRepository.save(body, {});
	}

	async findOne(options: any) {
		return this.userRepository.findOne(options);
	}
}
