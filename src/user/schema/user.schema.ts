import { Schema, Document } from 'mongoose';
import { User } from '../entities/user.entity';
import { UserRoles } from '../interfaces/roles';

export const UserSchema = new Schema({
  fullname: {
    type: String,
    required: [true, 'Enter full name.'],
  },
  username: {
    type: String,
    required: [true, 'A Username is required.'],
    validate: {
      validator: function (v) {
        return this.model('User')
          .findOne({ username: v })
          .then((user) => !user);
      },
      message: (props) => `Username is already taken`,
    },
  },
  email: {
    type: String,
    required: [true, 'email is required'],
    match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Invalid email format'],
    validate: {
      validator: function (v) {
        return this.model('User')
          .findOne({ email: v })
          .then((user) => !user);
      },
      message: (props) => `Email is already taken`,
    },
  },
  password: {
    type: String,
    required: [true, 'Enter a password.'],
  },
  config: {
    type: Object,
    required: false,
  },
  customProperties: {
    type: Object,
    required: false,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  // admin, user
  role: {
    type: String,
    enum: UserRoles,
    required: false,
    default: UserRoles.account,
  },
});

export type UserDocument = User & Document;
