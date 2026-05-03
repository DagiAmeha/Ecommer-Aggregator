import { DecodedIdToken } from "firebase-admin/auth";
import { User } from "../modules/user/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
      authUser?: User;
    }
  }
}

export {};
