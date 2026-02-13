import { Post } from "./post.interface";

export interface Channel {
  id: string;
  name: string;
  description: string;
  accent?: string;
  deleted?: boolean;
  deleted_at?: string;
  guidelines: string[];

  errors?: string;
}


export interface ChannelResponseObject {
  channel: Channel | null;
  posts: Post[] | null;
}
