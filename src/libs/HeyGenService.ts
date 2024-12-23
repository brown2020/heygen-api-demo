const HeyGenBaseUrl = 'https://api.heygen.com'
const HeyGenUploadBaseUrl = 'https://upload.heygen.com'

export const HeyGenService = {
    base_url: HeyGenBaseUrl,
    endpoints: {
        avatar_list: `${HeyGenBaseUrl}/v2/avatars`,
        avatar_group_list: (include_public: "true" | "false") => `${HeyGenBaseUrl}/v2/avatar_group.list?include_public=${include_public}`,
        avatar_group_looks_list: (group_id: string) => `${HeyGenBaseUrl}/v2/avatar_group/${group_id}/avatars`,
        upload_talking_photo: `${HeyGenUploadBaseUrl}/v1/talking_photo`,
    }
}