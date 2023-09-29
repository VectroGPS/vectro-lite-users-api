import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
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
import { AuthService } from 'src/auth/auth.service';
import { Roles } from 'src/auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRoles } from './interfaces/roles';
import { UserService } from './user.service';
import { diskStorage } from 'multer';
import { UseInterceptors } from '@nestjs/common/decorators/core/use-interceptors.decorator';
import { FilesService } from 'src/files/files.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
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
    console.log(user);
    return {
      message: 'signup successful',
      data: user,
    };
  }

  @Roles(UserRoles.admin, UserRoles.manager)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() createUserDto: Partial<CreateUserDto>,
  ) {
    console.log(createUserDto, id);
    const newUser = await this.userService.update(id, createUserDto);
    // const token = await this.authService.login({
    //   _id,
    //   username: rest.username,
    // });
    // console.log(rest);

    // rest['token'] = token;
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
    console.log(file);
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
