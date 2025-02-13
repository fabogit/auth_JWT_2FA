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
import * as speakeasy from 'speakeasy';

@Controller()
export class UserController {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private tokenService: TokenService,
  ) {}

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
   * Login endpoint to authenticate user and initiate the login process.
   * If user has TFA secret, it returns user id to proceed with two-factor authentication.
   * If user does not have TFA secret, it generates a new secret and returns user id, secret and otpauth_url for QR code generation.
   *
   * @param email User email from the request body.
   * @param password User password from the request body.
   * @param response Response object to set status.
   * @returns Resolves with an object containing user id, and optionally secret and otpauth_url if TFA is not setup.
   * @throws {NotFoundException} If user is not found with the provided email.
   * @throws {BadRequestException} If password does not match or invalid credentials.
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

    response.status(200);
    if (user.tfa_secret) {
      return {
        id: user.id,
      };
    }
    const secret = speakeasy.generateSecret({ name: 'My App' });
    return {
      id: user.id,
      secret: secret.ascii,
      otpauth_url: secret.otpauth_url,
    };
  }

  /**
   * Endpoint to verify two-factor authentication code and issue JWT tokens.
   * It verifies the provided code against the user's TFA secret.
   * If TFA secret is not yet set for the user, it will save the provided secret.
   * Upon successful verification, it signs access and refresh JWT tokens, saves refresh token in database as cookie.
   *
   * @param id User id from the request body.
   * @param code Two-factor authentication code from the request body.
   * @param response Response object to set cookie and status.
   * @param secret Optional secret from the request body. If provided, it will be used instead of user's tfa_secret for verification and will be saved if user's tfa_secret is empty.
   * @returns Resolves with an object containing access token.
   * @throws {BadRequestException} If invalid credentials or user not found.
   */
  @Post('two-factor')
  async twoFactor(
    @Body('id') id: number,
    @Body('code') code: string,
    @Response({ passthrough: true }) response: Res,
    @Body('secret') secret?: string,
  ) {
    const user = await this.userService.findOne({ id });
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    if (!secret) {
      secret = user.tfa_secret;
    }

    // verify code
    const isVerified = speakeasy.totp.verify({
      secret,
      encoding: 'ascii',
      token: code,
    });

    if (!isVerified) {
      throw new BadRequestException('Invalid credentials');
    }

    if (user.tfa_secret === '') {
      await this.userService.update(id, {
        tfa_secret: secret,
      });
    }

    // Sign jwt for the user
    const accessToken = await this.jwtService.signAsync(
      { id },
      { expiresIn: '30s' },
    );
    const refreshToken = await this.jwtService.signAsync({ id });
    // Save the refresh token in the db and set expiration to 1week
    const oneWeek = new Date();
    oneWeek.setDate(oneWeek.getDate() + 7);
    await this.tokenService.save({
      user_id: id,
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
