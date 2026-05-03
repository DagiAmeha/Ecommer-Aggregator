export interface AuthUser {
  id: number;
  firebase_uid: string;
  email: string;
  full_name: string | null;
  role: string;
}
