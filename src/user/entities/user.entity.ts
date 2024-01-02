import { Types } from 'mongoose';
import { UserRoles } from '../interfaces/roles';

export class UserEntity {
  _id?: string;
  fullname: string;
  config: any;
  customProperties: {
    // [key: string]: any;
    trackingList?: string[];
    whiteLabel: {
      icon?: string;
      logo?: string;
      title?: string;
    };
  };
  parent: Types.ObjectId;
  role: UserRoles;
  username: string;
  password?: string;
  email: string;
  resetPassword?: {
    token: string;
    expires: number;
  };
}
