import { Post } from "./post.interface";

export interface Channel {
  id: string;
  name: string;
  description: string;
  accent: string;
  guidelines: string[];
}


export interface ChannelResponseObject {
  channel: Channel | null;
  posts: Post[] | null;
}
