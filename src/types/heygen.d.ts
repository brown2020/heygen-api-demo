import { OWNERSHIP_TYPE } from "@/libs/constants";
import { FabricImage } from "fabric";
import * as fabric from 'fabric';

export interface Avatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url?: string;
}

export interface TalkingPhoto {
  talking_photo_id: string;
  talking_photo_name: string;
  preview_image_url: string;
}

export type AvatarGroupType = 'PHOTO' | 'PUBLIC_PHOTO' | 'PUBLIC';
export type AvatarGroupOwnerShipType = typeof OWNERSHIP_TYPE[number];
export interface AvatarGroup {
  id: string;
  name: string;
  preview_image_url: string | null;
  num_looks: number;
  group_type: AvatarGroupType;
  created_at: number;
  owner: string;
  type: AvatarGroupOwnerShipType;
}

export interface AvatarLook {
  id: string;
  group_id: string;
  image_url: string;
  video_url?: string;
  is_motion?: boolean;
  motion_preview_url?: string;
  created_at: number;
  name: string;
}

export type Emotion = 'neutral' | 'happy' | 'surprise' | 'serious';
export type Movement = 'neutral' | 'lively';
export type Frame = 'landscape' | 'square' | 'portrait' | 'fit';

export type NotificationType = 'video_generated'
export type NotificationStatus = 'unread' | 'read';

export type DIDVideoStatus = 'created' | 'done' | 'error' | 'started' | 'rejected';

export type VideoDetail = {
  id: string;
  did_id: string;
  title: string;
  avatar_id?: string;
  type: "personal" | "template";
  video_url?: string;
  owner: string;
  d_id_status: DIDVideoStatus;
  created_at: number;
  errorMessage?: string;
  error?: Record<string, unknown>;
}

export type NotificationDetail = {
  id?: string;
  type: NotificationType;
  created_at: number;
  status: NotificationStatus,
  video_id: string,
  user_id: string,
}

export type AvatarValues = {
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



interface CustomFabricImage
extends FabricImage<Partial<fabric.ImageProps>, fabric.SerializedImageProps, fabric.ObjectEvents> {
  is_avatar?: boolean; // Add a custom `id` property
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type CanvasObjects = any[];
type CanvasObject = {
  objects: CanvasObjects;
  background?: string;
  version: string;
};

type AvatarType = "avatar" | "talking_photo";

export interface HeyGenAvatarGroup {
  id: string;
  name: string;
  created_at: number;
  num_looks: number;
  preview_image_url: string | null;
  group_type: AvatarGroupType;
  train_status: string;      
}

export interface HeyGenAvatarGroupLookPhoto {
  id: string;
  image_url: string;
  created_at: number;
  name: string;
  status: string;
  group_id: string;
  is_motion: boolean;
  motion_preview_url: string;
}
export interface HeyGenAvatarGroupLookVideo {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url: string;
}

export type HeyGenAvatarGroupLook = HeyGenAvatarGroupLookVideo|HeyGenAvatarGroupLookPhoto;

export interface ApiAvatarGroupResponse {
  error: { message: string; code?: number } | string | null; // More specific type
  data: {
    total_count: number;
    avatar_group_list: HeyGenAvatarGroup[]
  }
}
export interface ApiAvatarGroupDetailResponse {
  error: { message: string; code?: number } | string | null; // More specific type
  data: {
    avatar_list: HeyGenAvatarGroupLook[]
  }
}


export interface HeyGenFailResponse {
  status: false;
  error: string;
  apiStatusCode?: number;
}

export type HeyGenErrorCode = "unauth-401";