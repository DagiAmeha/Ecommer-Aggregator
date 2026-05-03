import { DecodedIdToken } from "firebase-admin/auth";
import { firebaseAuth } from "../../config/firebase";
import {
  getUserByFirebaseUid,
  getUserByEmail,
  createUserRecord,
} from "../user/user.service";
import { CreateUserInput, User, UserRole } from "../user/user.model";

export async function getCurrentAuthenticatedUser(
  decodedToken: DecodedIdToken,
): Promise<User> {
  const existingUser = await getUserByFirebaseUid(decodedToken.uid);
  if (!existingUser) {
    throw new Error("User not found");
  }

  return existingUser;
}

export async function signUpUser(input: CreateUserInput): Promise<User> {
  const existingByFirebaseUid = await getUserByFirebaseUid(input.firebase_uid);
  if (existingByFirebaseUid) {
    throw new Error("User with this Firebase UID already exists");
  }

  const existingByEmail = await getUserByEmail(input.email);
  if (existingByEmail) {
    throw new Error("User with this email already exists");
  }

  return createUserRecord({
    firebase_uid: input.firebase_uid,
    email: input.email,
    full_name: input.full_name,
    phone_number: input.phone_number,
  });
}

export async function signInWithFirebaseIdToken(
  idToken: string,
): Promise<User> {
  const decodedToken = await firebaseAuth.verifyIdToken(idToken);
  return getCurrentAuthenticatedUser(decodedToken);
}

export async function logoutUser(firebaseUid: string): Promise<void> {
  await firebaseAuth.revokeRefreshTokens(firebaseUid);
}
