import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';

@Injectable()
export class UserService {
	constructor(@InjectRepository(User) protected readonly userRepository: Repository<User>) { }

	// TODO body type
	async save(body: any) {
		return this.userRepository.save(body, {});
	}

	async findOne(email: string) {
		return this.userRepository.findOne({ where: { email } });
	}
}