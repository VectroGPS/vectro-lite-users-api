import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRoles } from './interfaces/roles';
import { UserService } from './user.service';
import { diskStorage } from 'multer';
import { UseInterceptors } from '@nestjs/common/decorators/core/use-interceptors.decorator';
import { FilesService } from '../files/files.service';
import { Public } from '../auth/jwt.decorator';

// jwt auth guard is used module level (globally)
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly filesService: FilesService,
  ) {}
  @Get()
  async findAll(@Request() req) {
    const users = await this.userService.findAll(req.user);
    return {
      message: 'users found',
      data: users,
    };
  }
  @Roles(UserRoles.admin, UserRoles.manager)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const user = await this.userService.findOneWithId(id);
    return {
      message: 'user found',
      data: user,
    };
  }
  // @UseGuards(JwtAuthGaurd)
  @Roles(UserRoles.admin, UserRoles.manager)
  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    const user = await this.userService.create(createUserDto);
    return {
      message: 'signup successful',
      data: user,
    };
  }
  // @Roles(UserRoles.admin, UserRoles.manager)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() createUserDto: Partial<CreateUserDto>,
    @Request() req,
  ) {
    // if the user is not admin or manager, he can only update his own account
    if (
      req.user.role !== UserRoles.admin &&
      req.user.role !== UserRoles.manager
    ) {
      if (req.user._id.toString() !== id) {
        throw new BadRequestException([
          'You can only update your own account.',
        ]);
      }
    }
    const newUser = await this.userService.update(id, createUserDto);
    return {
      message: 'update successful',
      data: newUser,
    };
  }
  @Roles(UserRoles.admin, UserRoles.manager)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const user = await this.userService.remove(id);
    return {
      message: 'user deleted',
      data: user,
    };
  }
  // methods to forgot password
  // 1.- send email with token
  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    await this.userService.requestPasswordReset(body.email);
    return {
      message: 'email sent',
    };
  }
  // 2.- reset password
  @Public()
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password: string }) {
    try {
      await this.userService.resetPassword(body.token, body.password);
      return {
        message: 'password reset successful',
      };
    } catch (error) {
      console.log(error);
      // return {
      //   statusCode: HttpStatus.BAD_REQUEST,
      //   message: 'password reset failed',
      // };
      throw new BadRequestException(['password reset failed']);
    }
  }
  @Roles(UserRoles.account, UserRoles.admin, UserRoles.manager)
  @Post('icons/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'icon', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            // get the file extension by splitting the original name by dots and get the last element
            const extension = file.originalname.split('.').pop();
            return cb(null, `${randomName}.${extension}`);
          },
        }),
        // fileFilter: imageFileFilter,
      },
    ),
  )
  async uploadFile(
    @UploadedFiles()
    files: { icon?: Express.Multer.File[]; logo?: Express.Multer.File[] },
    @Param('id') id: string,
  ) {
    const user = await this.userService.findOneWithId(id);
    if (!user) {
      throw new BadRequestException(['User not found.']);
    }
    if (files.icon) {
      // remove old file
      const oldIcon = user.customProperties?.whiteLabel?.icon;
      if (oldIcon) {
        this.filesService.delete(oldIcon);
      }
    }
    if (files.logo) {
      // remove old file
      const oldLogo = user.customProperties?.whiteLabel?.logo;
      if (oldLogo) {
        this.filesService.delete(oldLogo);
      }
    }
    const user1 =
      files.icon &&
      (await this.userService.customProperties(
        id,
        'whiteLabel.icon',
        files.icon[0].filename,
      ));
    const user2 =
      files.logo &&
      (await this.userService.customProperties(
        id,
        'whiteLabel.logo',
        files.logo[0].filename,
      ));
    return {
      message: 'upload successful',
      data: user2 || user1,
    };
  }
  @Roles(UserRoles.account, UserRoles.admin, UserRoles.manager)
  @Delete('icons/:id/:file')
  async removeFile(
    @Param('id') id: string,
    @Param('file') file: 'icon' | 'logo',
  ) {
    const user = await this.userService.findOneWithId(id);
    if (!user) {
      throw new BadRequestException(['User not found.']);
    }
    const oldFile = user?.customProperties?.whiteLabel[file];
    if (!oldFile) {
      throw new BadRequestException(['File not found.']);
    }
    this.filesService.delete(oldFile);
    const newUser = await this.userService.customProperties(
      id,
      `whiteLabel.${file}`,
      null,
    );
    return {
      message: 'file deleted',
      data: newUser,
    };
  }
}
