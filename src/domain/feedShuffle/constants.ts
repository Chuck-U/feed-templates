
export const MAX_CAROUSEL_FEED_ITEMS = 5

export const singleInserts = [FeedOptions.CAROUSEL, FeedOptions.ELEMENT, FeedOptions.NEARBY_HEADER] 

import { CarouselType, FeedOptions, FeedProperty } from '../types/feed.model'
export const DEFAULT_LOCAL_BLOCK_MAX_ITEMS = 70
export const MINIMUM_CAROUSEL_CENTERS_TO_RENDER = 3
export const DEFAULT_FEED_LAYOUT: FeedProperty[] = [
  {
    feedType: FeedOptions.TOP,
    maxItems: DEFAULT_LOCAL_BLOCK_MAX_ITEMS
  },
  {
    feedType: FeedOptions.CAROUSEL,
    itemType: CarouselType.TopLocations,
    positionStart: 3
  },
  { feedType: FeedOptions.ORGANIC, maxItems: 1 },
  {
    feedType: FeedOptions.ADVERT,
    maxItems: 1
  },
  {
    feedType: FeedOptions.CAROUSEL,
    itemType: CarouselType.Insurance,
    positionStart: 16
  },
  {
    feedType: FeedOptions.CAROUSEL,
    itemType: CarouselType.NationWide,
    positionStart: 16
  }
]
