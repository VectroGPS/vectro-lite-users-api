import { UserRoles } from '../interfaces/roles';

export class User {
  _id?: string;
  fullname: string;
  config: any;
  customProperties: {
    [key: string]: any;
  };
  parent: string;
  role: UserRoles;
  username: string;
  password?: string;
  email: string;
}
