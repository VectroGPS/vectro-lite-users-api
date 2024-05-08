import {
  BadRequestException,
  Catch,
  ConsoleLogger,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
// const crypto = require('crypto');
import * as crypto from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Error, Model, Schema, Types } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcrypt');
import { CreateUserDto } from './dto/create-user.dto';
import { UserDocument, User } from './schema/user.schema';
// import { ConfigService } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { NotFoundError } from 'rxjs';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRoles } from './interfaces/roles';
import { EmailService } from '../email/email.service';

@Injectable()
export class UserService {
  jwtService: JwtService;
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.jwtService = new JwtService({
      secret: this.configService.get('JWT_SECRET'),
      signOptions: { expiresIn: '60s' },
    });
  }

  async findAll(loggedInUser: UserDocument): Promise<User[]> {
    if (this.isAdminOrManager(loggedInUser)) {
      return this.userModel.find({}, { password: 0, resetPassword: 0 }).exec();
    }

    if (loggedInUser.role === UserRoles.account) {
      return this.findUsersByParent(loggedInUser._id);
    }

    const parentAccount = await this.getParentAccount(loggedInUser.parent);
    const { whiteLabel } = parentAccount.customProperties;
    const user = await this.userModel
      .findById(loggedInUser._id, {
        password: 0,
        resetPassword: 0,
      })
      .exec();
    user.customProperties = { ...user.customProperties, whiteLabel };

    // const { password, ...rest } = user.toObject();
    return [user];
  }

  private isAdminOrManager(user: UserDocument): boolean {
    return [UserRoles.admin, UserRoles.manager].includes(user.role);
  }

  private async findUsersByParent(
    parentId: Types.ObjectId,
  ): Promise<UserDocument[]> {
    return this.userModel
      .find(
        { $or: [{ parent: parentId }, { _id: parentId }] },
        { password: 0, resetPassword: 0 },
      )
      .exec();
  }

  private async getParentAccount(
    parentId: Types.ObjectId,
  ): Promise<UserDocument> {
    return this.userModel.findOne({ _id: parentId }).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const salt = bcrypt.genSaltSync(
        parseInt(this.configService.get('SALT_ROUNDS')),
      );
      const encryptedPassword = bcrypt.hashSync(createUserDto.password, salt);
      createUserDto.password = encryptedPassword;
      const createdUser = new this.userModel({
        ...createUserDto,
        resetPassword: {
          firstLogin: true,
        },
      });
      const user = await createdUser.save();
      const { password, ...rest } = user.toObject();
      return rest;
    } catch (error) {
      throw new BadRequestException([
        error?.errors[Object.keys(error?.errors)[0]]?.message,
      ]);
    }
  }

  async findOneWithUsername(username: string): Promise<UserEntity> {
    const user = await this.userModel.findOne({ username: username }).exec();
    if (!user) {
      throw new BadRequestException(['User not found.']);
    }
    return user.toObject();
  }

  async findOneWithId(id: string): Promise<any> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new BadRequestException(['User not found.']);
    }
    return user.toObject();
  }

  async update(userId: string, createUserDto: Partial<CreateUserDto>) {
    // const { _id: id, ...rest } = user;
    try {
      if (createUserDto.password) {
        const salt = bcrypt.genSaltSync(
          parseInt(this.configService.get('SALT_ROUNDS')),
        );
        const encryptedPassword = bcrypt.hashSync(createUserDto.password, salt);
        createUserDto.password = encryptedPassword;
      }
      const user = await this.userModel
        .findByIdAndUpdate(
          userId,
          { ...createUserDto, resetPassword: null },
          { new: true },
        )
        .exec();
      if (!user) {
        throw new BadRequestException(['User not found.']);
      }
      const { password, ...rest } = user.toObject();
      // const userObject = user.toObject();
      // rest['token'] = this.jwtService.sign({ sub: _id.toString() });
      return { ...rest };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error);
    }
    // return `This action updates a #${id} user`;
  }

  async updateFirebaseToken(userId: string, token: string) {
    try {
      const map = new Map();
      const user = await this.userModel.findById(userId).exec();
      user.firebaseMessagingToken?.forEach((t) => map.set(t.split(':')[0], t));
      map.set(token.split(':')[0], token);
      user.firebaseMessagingToken = Array.from(map.values());

      const updatedUser = await this.userModel
        .findByIdAndUpdate(userId, user, { new: true })
        .exec();
      if (!updatedUser) {
        throw new BadRequestException(['User not found.']);
      }
      const { password, ...rest } = updatedUser.toObject();
      console.log(rest);
      return { ...rest };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async customProperties(userId: string, key: string, value: any) {
    try {
      const user = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $set: { [`customProperties.${key}`]: value } },
          { new: true },
        )
        .exec();
      if (!user) {
        throw new BadRequestException(['User not found.']);
      }
      const { password, ...rest } = user.toObject();
      return { ...rest };
    } catch (error) {
      throw new BadRequestException([
        error?.errors[Object.keys(error?.errors)[0]]?.message,
      ]);
    }
  }

  remove(id: string) {
    return this.userModel.findByIdAndRemove(id).exec();
  }
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      // throw new BadRequestException(['User not found.']);
      return;
    }
    const parentAccount = await this.getParentAccount(user.parent);

    // Generar y guardar un token temporal para restablecer la contraseña
    const resetToken = this.generateResetToken();
    user.resetPassword = {
      token: resetToken,
      expires: Date.now() + 3600000, // tiempo de expiracion = 1 hora
    };
    await this.userModel.findByIdAndUpdate(user._id, user, { new: true });
    const title =
      user?.customProperties?.whiteLabel?.title ||
      parentAccount?.customProperties?.whiteLabel?.title;
    // Aquí deberías enviar un correo electrónico con el token y el enlace de restablecimiento
    this.emailService.sendResetPasswordEmail(user.email, resetToken, title);

    // Opcional: Log para verificar el token generado
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userModel
      .findOne({
        // resetPasswordToken: token,
        // resetPasswordExpires: { $gt: Date.now() },
        'resetPassword.token': token,
        'resetPassword.expires': { $gt: Date.now() },
      })
      .exec();

    if (!user) {
      throw new BadRequestException(['Invalid or expired token.']);
    }
    // Actualizar la contraseña y limpiar el token temporal
    const salt = bcrypt.genSaltSync(
      parseInt(this.configService.get('SALT_ROUNDS')),
    );
    const encryptedPassword = bcrypt.hashSync(newPassword, salt);
    user.password = encryptedPassword;
    // user.resetPasswordToken = undefined;
    // user.resetPasswordExpires = undefined;
    user.resetPassword = null;
    const user1 = await this.userModel.findByIdAndUpdate(user._id, user, {
      new: true,
    });
  }

  private generateResetToken(): string {
    // Implementa la lógica para generar un token único aquí (puedes usar bibliotecas como `crypto` o `uuid`)
    // Aquí se muestra un ejemplo básico usando `crypto`
    return crypto.randomBytes(8).toString('hex');
  }
}
