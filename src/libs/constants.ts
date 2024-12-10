import AudioList from './audio-list.json';

export const VIDEO_COLLECTION = 'generated-videos';
export const WEBHOOK_HISTORY_COLLECTION = 'webhook-history';
export const ERROR_REPORT_COLLECTION = 'error-report';
export const DOCUMENT_COLLECTION = 'didTalkingPhotos';
export const NOTIFICATION_COLLECTION = "notifications";

export const AVATAR_TYPE_PERSONAL = 'personal';
export const AVATAR_TYPE_TEMPLATE = 'template';

export const NOTIFICATION_TYPE = {
    VIDEO_GENERATED: "video_generated",
    VIDEO_GENERATION_FAILED: "video_generation_failed",
};

export const NOTIFICATION_STATUS = {
    UNREAD : 'unread',
    READ: 'read'
};


export const AUDIO_LIST = AudioList;
export const DEFAULT_AUDIO = AudioList[0].voice_id;