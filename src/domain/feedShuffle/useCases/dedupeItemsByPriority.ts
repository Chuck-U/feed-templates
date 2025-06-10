import { FeedPlacement, Item } from '../../types/feed.model'
import { isNonEmptyArray } from '../../utils/checks'

export const removePriorityItemsFromCenters = ({
  listWithPriority,
  listToRemoveFrom
}: {
  listWithPriority: (Item)[]
  listToRemoveFrom: (Item)[]
}) => {
  if (!isNonEmptyArray(listWithPriority)) {
    const dedupedList = new Map<Item['id'], Item>(
      listToRemoveFrom?.map((item) => [item.id, item])
    )
    return Array.from(dedupedList.values())
  }

  const organicCentersUnique = new Map<Item['id'], Item>(
    listWithPriority.map((item) => [item?.id, item])
  )

  const adsUnique = new Map<Item['id'], Item>(
    listToRemoveFrom?.map((item) => [item.id, item])
  )

  return Array.from(adsUnique.values()).filter((item) => {
    return !organicCentersUnique.has(item.id)
  })
}
