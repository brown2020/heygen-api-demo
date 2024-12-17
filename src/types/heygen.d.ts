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