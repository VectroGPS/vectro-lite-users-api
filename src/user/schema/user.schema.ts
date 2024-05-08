import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { UserEntity } from '../entities/user.entity';
import { UserRoles } from '../interfaces/roles';

export type UserDocument = HydratedDocument<User>;
@Schema()
export class User implements UserEntity {
  @Prop({ type: String, required: true })
  fullname: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return this.model('User')
          .findOne({ username: v })
          .then((user) => !user);
      },
      message: (props) => `Username is already taken`,
    },
  })
  username: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Invalid email format'],
  })
  email: string;

  @Prop({ type: String, required: true })
  password?: string;

  @Prop({ type: Object, required: false })
  config: any;

  @Prop(
    raw({
      trackingList: { type: [String], required: false },
      geofencesShowed: { type: [String], required: false },
      whiteLabel: {
        icon: { type: String, required: false },
        logo: { type: String, required: false },
        title: { type: String, required: false },
      },
    }),
  )
  customProperties: {
    // [key: string]: any;
    trackingList?: string[];
    geofencesShowed?: string[];
    whiteLabel: {
      icon: string;
      logo?: string;
      title?: string;
    };
  };

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  parent: Types.ObjectId;

  @Prop({
    type: String,
    enum: UserRoles,
    required: false,
    default: UserRoles.account,
  })
  role: UserRoles;

  @Prop({ type: [String], required: false })
  firebaseMessagingToken: string[];

  @Prop(
    raw({
      token: { type: String },
      expires: { type: Number },
      firstLogin: { type: Boolean },
    }),
  )
  resetPassword?: {
    token?: string;
    expires?: number;
    firstLogin?: boolean;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
