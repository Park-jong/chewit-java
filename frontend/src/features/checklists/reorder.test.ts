import { describe, it, expect } from 'vitest'
import { reorderByDrag } from './reorder'

function makeItems(ids: number[]): { id: number }[] {
  return ids.map((id) => ({ id }))
}

describe('reorderByDrag', () => {
  const items = makeItems([1, 2, 3, 4])

  it('앞에서 뒤로 이동한다', () => {
    expect(reorderByDrag(items, 1, 3)).toEqual([2, 3, 1, 4])
  })

  it('뒤에서 앞으로 이동한다', () => {
    expect(reorderByDrag(items, 4, 2)).toEqual([1, 4, 2, 3])
  })

  it('인접 아이템을 교환한다', () => {
    expect(reorderByDrag(items, 2, 3)).toEqual([1, 3, 2, 4])
    expect(reorderByDrag(items, 3, 2)).toEqual([1, 3, 2, 4])
  })

  it('맨 앞으로 이동한다', () => {
    expect(reorderByDrag(items, 3, 1)).toEqual([3, 1, 2, 4])
  })

  it('맨 끝으로 이동한다', () => {
    expect(reorderByDrag(items, 2, 4)).toEqual([1, 3, 4, 2])
  })

  it('자기 자신에게 드롭하면 null을 반환한다', () => {
    expect(reorderByDrag(items, 2, 2)).toBeNull()
  })

  it('존재하지 않는 sourceId면 null을 반환한다', () => {
    expect(reorderByDrag(items, 99, 2)).toBeNull()
  })

  it('존재하지 않는 targetId면 null을 반환한다', () => {
    expect(reorderByDrag(items, 2, 99)).toBeNull()
  })

  it('빈 배열이면 null을 반환한다', () => {
    expect(reorderByDrag([], 1, 2)).toBeNull()
  })

  it('원소가 1개면 null을 반환한다', () => {
    expect(reorderByDrag(makeItems([1]), 1, 1)).toBeNull()
    expect(reorderByDrag(makeItems([1]), 1, 2)).toBeNull()
  })

  it('입력 배열을 변경하지 않는다', () => {
    const input = makeItems([1, 2, 3])
    const snapshot = input.map((item) => ({ ...item }))
    const result = reorderByDrag(input, 1, 3)

    expect(result).toEqual([2, 3, 1])
    expect(input).toEqual(snapshot)
  })
})
