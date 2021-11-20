import { createState } from '@hookstate/core'
import { dispatchFrom } from '@xrengine/engine/src/networking/functions/dispatchFrom'
import { NetworkWorldAction } from '@xrengine/engine/src/networking/functions/NetworkWorldAction'
import { UserId } from '../../../../common/src/interfaces/UserId'
import { GolfState, golfReceptor, receptorSpawnAvatar } from '../GolfSystem'
import assert from 'assert'
import { MathUtils } from 'three'
import { createWorld } from '@xrengine/engine/src/ecs/classes/World'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'

const mockState = () => createState({
  players: [] as Array<{
    userId: UserId
    scores: Array<number | undefined>
    stroke: number
    viewingScorecard: boolean
    viewingCourseScore: boolean
    isConnected: boolean
  }>,
  currentPlayerId: undefined! as UserId,
  currentHole: 0
})

describe('Golf Receptors', () => {
  it('receptorSpawnAvatar', () => {
    // setup
    const world = createWorld()
    Engine.currentWorld = world

    // mock
    const mockGolfState = mockState()
    const mockUserId = MathUtils.generateUUID()

    // logic
    receptorSpawnAvatar(mockGolfState, {
      type: 'network.SPAWN_OBJECT',
      userId: mockUserId as UserId,
      parameters: {} as any,
    } as any)

    // test
    assert.deepEqual(mockGolfState.players.length, 1)
    assert.deepEqual(mockGolfState.players[0].userId, mockUserId)
  })
})