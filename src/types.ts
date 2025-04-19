export type SortOrder = "asc" | "desc";
export type SortField = "default" | "likes" | "recasts" | "replies";

export type CastResponse = {
    casts: Cast[];
    next: {
        cursor: string;
    };
};

export type Cast = {
    object: string;
    hash: string;
    author: User;
    app: UserDehydrated;
    thread_hash: string;
    parent_hash: string | null;
    parent_url: string;
    root_parent_url: string;
    parent_author: {
        fid: number | null;
    };
    text: string;
    timestamp: string;
    embeds: Embed[];
    channel: ChannelDehydrated;
    reactions: Reactions;
    replies: {
        count: number;
    };
    mentioned_profiles: User[];
    mentioned_profiles_ranges: any[];
    mentioned_channels: any[];
    mentioned_channels_ranges: any[];
    author_channel_context: {
        role: string;
        following: boolean;
    };
};

type User = {
    object: string;
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    custody_address: string;
    profile?: {
        bio?: {
            text: string;
        };
    };
    follower_count: number;
    following_count: number;
    verifications: string[];
    verified_addresses: {
        eth_addresses: string[];
        sol_addresses: string[];
        primary: {
            eth_address: string | null;
            sol_address: string | null;
        };
    };
    verified_accounts: {
        platform: string;
        username: string;
    }[];
    power_badge: boolean;
};

type UserDehydrated = {
    object: string;
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    custody_address: string;
};

type ChannelDehydrated = {
    object: string;
    id: string;
    name: string;
    image_url: string;
};

type Reactions = {
    likes_count: number;
    recasts_count: number;
    likes: any[];
    recasts: any[];
};

export type Embed =
    | {
          // Direct image embed
          url: string;
          metadata: {
              content_type: string;
              content_length: number;
              _status: string;
              image: {
                  width_px: number;
                  height_px: number;
              };
          };
      }
    | {
          // OpenGraph link embed
          url: string;
          metadata: {
              content_type: string;
              content_length: number | null;
              _status: string;
              html: {
                  ogUrl: string;
                  oembed?: {
                      html: string;
                      type: string;
                      title: string;
                      width: number;
                      height: number;
                      method: string;
                      version: string;
                      iframe_url: string;
                      provider_url: string;
                      provider_name: string;
                      thumbnail_url: string;
                      thumbnail_width: number;
                      thumbnail_height: number;
                  };
                  ogType: string;
                  favicon: string;
                  ogAudio?: string;
                  ogImage: {
                      url: string;
                  }[];
                  ogTitle: string;
                  ogLocale: string;
                  ogSiteName: string;
                  ogAudioType?: string;
                  ogDescription: string;
              };
          };
      }
    | {
          // Cast embed
          cast_id: {
              fid: number;
              hash: string;
          };
          cast: CastEmbedded;
      };

export type CastEmbedded = {
    object: "cast_embedded";
    hash: string;
    author: UserDehydrated;
    app: UserDehydrated;
    thread_hash: string;
    parent_hash: string | null;
    parent_url: string | null;
    root_parent_url: string | null;
    parent_author: ParentAuthor;
    text: string;
    timestamp: string;
    embeds: EmbedInCast[];
    channel: any | null;
};

export type EmbedInCast = {
    url: string;
    metadata: {
        content_type: string;
        content_length: number;
        _status: string;
        image: {
            width_px: number;
            height_px: number;
        };
    };
};

export type ParentAuthor = {
    fid: number | null;
};
