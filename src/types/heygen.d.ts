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
  favorite?: boolean;
  name?: string;
  project?: string;
}

export interface HeygenAvatarResponse {
  error: any;
  data: {
    avatars: Avatar[];
    talking_photos: TalkingPhoto[];
  };
}
