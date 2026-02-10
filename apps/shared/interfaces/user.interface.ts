export interface User {
    id: string;
    username: string;
    display_name: string;
    role: Role;
    title?: string;
    password_hash?: string;
    password_salt?: string;
    created_at?: string;
}

export enum Role {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
  MODERATOR = 'moderator',
}
