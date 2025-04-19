import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import type { Cast, CastResponse } from "./types";
import { getDateFilter } from "./utils/utils";

type Bindings = {
    NEYNAR_API_KEY: string;
};

type SortOrder = "asc" | "desc";
type SortField = "default" | "likes" | "recasts" | "replies";

const app = new Hono<{ Bindings: Bindings }>();

app.use(cors());
app.use(csrf());

app.get("/:fid", async (c) => {
    const fid = Number.parseInt(c.req.param("fid")) || 405941;
    const sortField = (c.req.query("sortBy") as SortField) || "default";
    const sortOrder = (c.req.query("order") as SortOrder) || "desc";
    const limit = 150;
    const includeReplies = false;

    if (Number.isNaN(fid)) {
        return c.json({ message: "Invalid FID format" }, { status: 400 });
    }

    const headers = {
        accept: "application/json",
        "x-api-key": c.env.NEYNAR_API_KEY,
        "x-neynar-experimental": "false",
    };

    const options = {
        method: "GET",
        headers,
    };

    try {
        let allCasts: Cast[] = [];
        let cursor: string | undefined = undefined;
        let hasMore = true;

        const tuesdayDate = getDateFilter();
        console.log(`Filtering casts since: ${tuesdayDate.toISOString()}`);

        while (hasMore) {
            const url = cursor
                ? `https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${fid}&limit=${limit}&cursor=${cursor}&include_replies=${includeReplies}`
                : `https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${fid}&limit=${limit}&include_replies=${includeReplies}`;

            const response = await fetch(url, options);
            if (!response.ok) {
                console.error(
                    `API error: ${response.status} ${response.statusText}`,
                );
                return c.json(
                    { error: "Problem fetching from Neynar API" },
                    { status: 500 },
                );
            }

            const data: CastResponse = await response.json();

            if (!data.casts || data.casts.length === 0) {
                console.log("No more casts to fetch");
                hasMore = false;
                break;
            }

            allCasts = [...allCasts, ...data.casts];
            console.log(
                `Fetched ${data.casts.length} casts, total: ${allCasts.length}`,
            );

            // check if oldest cast is after tuesday, if yes, then stop fetching more
            const oldestCastDate = new Date(
                data.casts[data.casts.length - 1].timestamp,
            );

            if (oldestCastDate < tuesdayDate) {
                console.log(
                    "Reached casts before Tuesday, stopping pagination",
                );
                hasMore = false;
            } else if (data.next?.cursor && allCasts.length < 300) {
                cursor = data.next.cursor;
            } else {
                hasMore = false;
            }
        }
        console.log(
            "All cast from tuesday received successfully, now filtering casts",
        );

        // filter from tuesday onwards
        const filteredCasts = allCasts.filter((cast) => {
            const castDate = new Date(cast.timestamp);
            return castDate >= tuesdayDate;
        });

        console.log(`Found ${filteredCasts.length} casts since Tuesday`);

        //TODO: improve this - ask how warpcast measures.
        const getPopularityScore = (cast: Cast) => {
            const likesCount = cast.reactions?.likes_count || 0;
            const recastsCount = cast.reactions?.recasts_count || 0;
            const repliesCount = cast.replies?.count || 0;

            // Weighted popularity score -
            return likesCount + recastsCount * 1.2 + repliesCount;
        };

        const sortedCasts = filteredCasts.sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case "likes":
                    comparison =
                        (a.reactions?.likes_count || 0) -
                        (b.reactions?.likes_count || 0);
                    break;
                case "recasts":
                    comparison =
                        (a.reactions?.recasts_count || 0) -
                        (b.reactions?.recasts_count || 0);
                    break;
                case "replies":
                    comparison =
                        (a.replies?.count || 0) - (b.replies?.count || 0);
                    break;
                default:
                    comparison = getPopularityScore(a) - getPopularityScore(b);
                    break;
            }

            return sortOrder === "asc" ? comparison : -comparison;
        });

        // Take only the top 20
        const topCasts = sortedCasts.slice(0, 20);

        console.log(
            `Found ${filteredCasts.length} casts since Tuesday, returning top ${topCasts.length}`,
        );

        return c.json(
            {
                casts: topCasts,
                meta: {
                    sortBy: sortField,
                    order: sortOrder,
                },
            },
            200,
        );
    } catch (e) {
        console.error("Error fetching casts:", e);
        return c.json({ error: "Internal server error" }, { status: 500 });
    }
});

export default app;

// - Most liked casts since Tuesday:
//   ```
//   GET /:fid?sortBy=likes&order=desc
//   ```

// - Most recent casts (regardless of Tuesday filter):
//   ```
//   GET /:fid?sortBy=timestamp&order=desc
//   ```

// - Oldest casts first, limited to 5:
//   ```
//   GET /:fid?sortBy=timestamp&order=asc&limit=5
//   ```

// - Most replied-to casts:
//   ```
//   GET /:fid?sortBy=replies&order=desc
