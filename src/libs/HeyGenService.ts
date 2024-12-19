const HeyGenBaseUrl = 'https://api.heygen.com/v2'
export const HeyGenService = {
    base_url: HeyGenBaseUrl,
    endpoints: {
        avatar_list: `${HeyGenBaseUrl}/avatars`,
        avatar_group_list: `${HeyGenBaseUrl}/avatar_group.list?include_public=true`,
        avatar_group_looks_list: (group_id: string) => `${HeyGenBaseUrl}/avatar_group/${group_id}/avatars`,
    }
}