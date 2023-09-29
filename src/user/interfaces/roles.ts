export enum UserRoles {
  admin = 'admin',
  manager = 'manager',
  account = 'account',
  basic = 'basic',
  noCommads = 'noCommads',
}

export type UserRolesKeys = keyof typeof UserRoles;

export const userRolesArray = Object.keys(UserRoles) as UserRolesKeys[];
