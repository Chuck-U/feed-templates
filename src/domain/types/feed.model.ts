export enum FeedOptions {
    TOP = 'top',
    ORGANIC = 'organic',
    ADVERT = 'advert',
    LOCAL = 'local',
    NEARBY = 'nearby',
    Carousel = 'carousel',
    Element = 'element',
    NearbyHeader = 'nearbyHeader',
    Featured = 'featured'
  }
  
  export enum CarouselType {
    Insurance = 'insurance',
    TopLocations = 'topLocations',
    NationWide = 'nationWide',
    Featured = 'featured'
  }
  
  export type Header = {
    title: string
    location?: string
    term?: string
  }
  
  type RepeatPattern = {
    repeatEvery: number
    itemsToAdd: number
  }
  
  export type InFeedProperties = {
    feedSource?: FeedOptions
    repeatEvery?: number
    repeatPattern?: RepeatPattern[]
    maxItems?: number
    inFeedSources?: Array<{
      feedSource: FeedOptions
      maxItems?: number
    }>
  }
  
  export type FeedProperty = {
    feedType: FeedOptions
    positionStart?: number
    itemType?: string
    inFeed?: InFeedProperties
    maxItems?: number
    header?: Header
  }
  
  export type Feed = {
    [k in FeedOptions]: keyof typeof FeedOptions
  } & {
    [k: string]: keyof typeof FeedOptions
  }[]
  

export interface FeedPlacement {
    feedPosition: number
    feedType: FeedOptions
    item: Record<string, any>
    placedInFeed: FeedOptions
}


  
  export enum FeedItemEnum {
    local = 'localItems',
    organic = 'organicItems',
    nearby = 'nearbyItems',
    midFeed = 'midFeedAdsItems',
    featured = 'featuredItems'
  }
  
  export type FeedItems = {
    [K in FeedItemEnum]: Partial<CenterFeedPlacement>[]
  }
  