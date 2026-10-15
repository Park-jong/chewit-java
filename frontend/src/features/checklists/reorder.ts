/**
 * 드래그 앤 드롭으로 아이템을 source 위치에서 target 위치로 옮긴 뒤의 id 순서를 반환한다.
 * 변경이 없는 경우(source === target, 존재하지 않는 id)에는 null을 반환한다.
 * 입력 배열은 변경하지 않는다.
 */
export function reorderByDrag(
  items: ReadonlyArray<{ id: number }>,
  sourceId: number,
  targetId: number,
): number[] | null {
  if (sourceId === targetId) return null

  const fromIndex = items.findIndex((item) => item.id === sourceId)
  const toIndex = items.findIndex((item) => item.id === targetId)
  if (fromIndex === -1 || toIndex === -1) return null

  const ids = items.map((item) => item.id)
  const [moved] = ids.splice(fromIndex, 1)
  ids.splice(toIndex, 0, moved)
  return ids
}
