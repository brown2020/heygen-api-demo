import AudioList from './audio-list.json';

export const VIDEO_COLLECTION = 'heygen-generated-videos';
export const WEBHOOK_HISTORY_COLLECTION = 'heygen-webhook-history';
export const ERROR_REPORT_COLLECTION = 'heygen-error-report';
export const AVATAR_GROUP_COLLECTION = 'heygen-avatar-groups';
export const AVATAR_NOT_FOUND_GROUP_COLLECTION = 'heygen-avatar-not-found-groups';
export const AVATAR_GROUP_LOOK_COLLECTION = 'heygen-avatar-group-looks';
export const DOCUMENT_COLLECTION = 'heygen-didTalkingPhotos';
export const NOTIFICATION_COLLECTION = 'heygen-notifications';

export const NOTIFICATION_TYPE = {
    VIDEO_GENERATED: "video_generated",
    VIDEO_GENERATION_FAILED: "video_generation_failed",
};
export const OWNERSHIP_TYPE = ['public', 'personal'] as const;

export const NOTIFICATION_STATUS = {
    UNREAD : 'unread',
    READ: 'read'
};

export const PER_PAGE_LIMIT = 12;

export const AUDIO_LIST = AudioList;
export const DEFAULT_AUDIO = AudioList[0].voice_id;