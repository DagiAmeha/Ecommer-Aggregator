import {
  createUser,
  CreateUserInput,
  findUserByEmail,
  findUserByFirebaseUid,
  findUserById,
  listAllUsers,
  updateUserProfile,
  updateUserRole,
  UpdateUserProfileInput,
  User,
  UserRole,
} from "./user.model";

export async function createUserRecord(
  payload: CreateUserInput,
): Promise<User> {
  return createUser(payload);
}

export async function getUserByFirebaseUid(
  firebaseUid: string,
): Promise<User | null> {
  return findUserByFirebaseUid(firebaseUid);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return findUserByEmail(email);
}

export async function getUserById(id: number): Promise<User | null> {
  return findUserById(id);
}

export async function getAllUsers(): Promise<User[]> {
  return listAllUsers();
}

export async function updateUserProfileRecord(
  id: number,
  payload: UpdateUserProfileInput,
): Promise<User | null> {
  return updateUserProfile(id, payload);
}

export async function updateUserRoleRecord(
  id: number,
  role: UserRole,
): Promise<User | null> {
  return updateUserRole(id, role);
}
