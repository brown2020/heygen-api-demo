export interface Avatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url?: string;
  favorite?: boolean;
  name?: string;
  project?: string;
}

export interface TalkingPhoto {
  talking_photo_id: string;
  talking_photo_name: string;
  preview_image_url: string;
  favorite_of?: string[];
  favorite?: boolean;
  name?: string;
  project?: string;
  type?: string;
  voiceId?: string;
  owner?: string;
}

export type NotificationType = 'video_generated'
export type NotificationStatus = 'unread' | 'read';


export type NotificationDetail = {
  id?: string;
  type: NotificationType;
  created_at: number;
  status: NotificationStatus,
  video_id: string,
  user_id: string,
}

export type AvatarValues = {
  voiceId: string;
  name: string;
  preview_image_url: string;
  talking_photo_id: string;
};


export interface HeygenAvatarResponse {
  error: { message: string; code?: number } | string | null; // More specific type
  data: {
    avatars: Avatar[];
    talking_photos: TalkingPhoto[];
  };
}
