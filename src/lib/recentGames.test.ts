import { describe, it, expect, beforeEach } from 'vitest'
import { addRecentGame, getRecentGames, removeRecentGame } from './recentGames'
import type { Game } from '../api/gamesApi'

function makeGame(id: string, name = `Game ${id}`): Game {
  return { id, name, coverImageUrl: null, genre: null }
}

describe('recentGames', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns an empty array when nothing is stored', () => {
    expect(getRecentGames()).toEqual([])
  })

  it('adds a game to the front of the list', () => {
    addRecentGame(makeGame('1'))
    addRecentGame(makeGame('2'))
    expect(getRecentGames().map((g) => g.id)).toEqual(['2', '1'])
  })

  it('dedupes by id, moving the existing entry to the front', () => {
    addRecentGame(makeGame('1'))
    addRecentGame(makeGame('2'))
    addRecentGame(makeGame('1'))
    expect(getRecentGames().map((g) => g.id)).toEqual(['1', '2'])
  })

  it('caps the list at 5 entries', () => {
    for (let i = 1; i <= 6; i++) addRecentGame(makeGame(String(i)))
    const ids = getRecentGames().map((g) => g.id)
    expect(ids).toHaveLength(5)
    expect(ids).toEqual(['6', '5', '4', '3', '2'])
  })

  it('removes a game by id', () => {
    addRecentGame(makeGame('1'))
    addRecentGame(makeGame('2'))
    removeRecentGame('1')
    expect(getRecentGames().map((g) => g.id)).toEqual(['2'])
  })

  it('filters out corrupt/legacy entries', () => {
    localStorage.setItem('playr_recent_games_v2', JSON.stringify(['just-a-string', { id: '1' }, makeGame('2')]))
    expect(getRecentGames().map((g) => g.id)).toEqual(['2'])
  })

  it('returns an empty array for invalid JSON', () => {
    localStorage.setItem('playr_recent_games_v2', '{not json')
    expect(getRecentGames()).toEqual([])
  })
})
