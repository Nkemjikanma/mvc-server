import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import type { Cast, CastResponse } from "./types";
import { getDateFilter, getPopularityScore } from "./utils/utils";

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
    const includeReplies = true;

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

            console.log(allCasts);

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

        return c.json(
            {
                casts: filteredCasts,
                meta: {
                    total: filteredCasts.length,
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
