import { FeedPlacement } from "../../types/feed.model"

  export const sortConstructedFeed = (
      feed: FeedPlacement[]
  ): FeedPlacement[] =>
    feed
      .filter(Boolean)
      .sort((a, b) => a.feedPosition - b.feedPosition)
      .map((item, index) => {
        return { ...item, feedPosition: index }
      }) as FeedPlacement[]
  