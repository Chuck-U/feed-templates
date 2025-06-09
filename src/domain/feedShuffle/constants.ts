export const sortConstructedFeed = (
    feed: CenterFeedPlacement[]
  ): CenterFeedPlacement[] =>
    feed
      .filter(Boolean)
      .sort((a, b) => a.feedPosition - b.feedPosition)
      .map((item, index) => {
        return { ...item, feedPosition: index }
      }) as CenterFeedPlacement[]
  