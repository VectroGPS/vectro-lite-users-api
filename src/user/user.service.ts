import {
  BadRequestException,
  Catch,
  ConsoleLogger,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Error, Model } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcrypt');
import { CreateUserDto } from './dto/create-user.dto';
import { UserDocument } from './schema/user.schema';
// import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { NotFoundError } from 'rxjs';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRoles } from './interfaces/roles';

@Injectable()
export class UserService {
  jwtService: JwtService;
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {
    this.jwtService = new JwtService({
      secret: this.configService.get('JWT_SECRET'),
      signOptions: { expiresIn: '60s' },
    });
  }

  async findAll(user: UserDocument): Promise<User[]> {
    let users: UserDocument[];
    if ([UserRoles.admin, UserRoles.manager].includes(user.role)) {
      users = await this.userModel.find().exec();
    } else if (user.role === UserRoles.account) {
      // busca los usuarios que tengan como parent el id del usuario logueado o el mismo id del usuario logueado
      users = await this.userModel.find({
        $or: [{ parent: user._id }, { _id: user._id }],
      });
    } else {
      const parentAccount = await this.userModel
        .findOne({ _id: user.parent })
        .exec();
      const { whiteLabel } = parentAccount.customProperties;
      users = await this.userModel.find({ _id: user._id }).exec();
      // users[0].customProperties.whiteLabel = whiteLabel;
      users[0].customProperties = { ...users[0].customProperties, whiteLabel };
    }
    return users.map((user) => {
      const { password, ...rest } = user.toObject();
      return rest as User;
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const salt = bcrypt.genSaltSync(
        parseInt(this.configService.get('SALT_ROUNDS')),
      );
      const encryptedPassword = bcrypt.hashSync(createUserDto.password, salt);
      createUserDto.password = encryptedPassword;
      const createdUser = new this.userModel(createUserDto);
      const user = await createdUser.save();
      const { password, ...rest } = user.toObject();

      return rest;
    } catch (error) {
      throw new BadRequestException([
        error?.errors[Object.keys(error?.errors)[0]]?.message,
      ]);
    }
  }

  async findOneWithUsername(username: string): Promise<any> {
    const user = await this.userModel.findOne({ username: username }).exec();
    console.log(user);
    if (!user) {
      throw new BadRequestException(['User not found.']);
    }
    return user.toObject();
  }

  async findOneWithId(id: string): Promise<any> {
    console.log(id);
    console.log(await this.userModel.find({ _id: id }).exec());
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
        .findByIdAndUpdate(userId, createUserDto, { new: true })
        .exec();
      if (!user) {
        throw new BadRequestException(['User not found.']);
      }
      const { password, ...rest } = user.toObject();
      // const userObject = user.toObject();
      // rest['token'] = this.jwtService.sign({ sub: _id.toString() });
      return { ...rest };
    } catch (error) {
      throw new BadRequestException([
        error?.errors[Object.keys(error?.errors)[0]]?.message,
      ]);
    }
    // return `This action updates a #${id} user`;
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
    console.log(`This action removes a #${id} user`);
    return this.userModel.findByIdAndRemove(id).exec();
    return `This action removes a #${id} user`;
  }
}
