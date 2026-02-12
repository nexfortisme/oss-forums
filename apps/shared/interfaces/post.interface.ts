import { PostComments } from "./comments.interface";

export interface Post {
  id: string; // Crated By Backend
  channel_id: string; // Channel ID
  author_id: string; // Set By Backend
  title?: string;
  body: string;
  deleted?: boolean;
  created_at: string; // Set By DB
  deleted_at?: string;
  moderation_status?: string;
  moderation_reason?: string;
  moderated_by?: string;
  moderated_at?: string;
}


export interface PostResponseObject {
  post: Post | null;
  comments: PostComments[] | null;
}
