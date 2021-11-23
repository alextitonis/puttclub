import { createState } from '@hookstate/core'
import { dispatchFrom } from '@xrengine/engine/src/networking/functions/dispatchFrom'
import { NetworkWorldAction } from '@xrengine/engine/src/networking/functions/NetworkWorldAction'
import { UserId } from '@xrengine/common/src/interfaces/UserId'
import assert from 'assert'
import { MathUtils } from 'three'
import { createWorld, World } from '@xrengine/engine/src/ecs/classes/World'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { receptorBallStopped, receptorPlayerLeave, receptorSpawnAvatar } from '../GolfStateReceptors'
import { GolfAction } from '../GolfAction'

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

const mockTick = 1/60

const executeWorld = () => {
  Engine.currentWorld!.execute(mockTick, Engine.currentWorld!.elapsedTime + mockTick)
}

describe('Golf State', () => {

  afterEach(() => {
    Engine.defaultWorld = null!
    Engine.currentWorld = null!
  })
  
  beforeEach(() => {
    const world = createWorld()
    Engine.currentWorld = world
  })
  
  it('player connect', () => {

    const mockGolfState = mockState()
    const mockUserId = MathUtils.generateUUID()

    it('should add player to state', () => {
      receptorSpawnAvatar(mockGolfState, NetworkWorldAction.spawnAvatar({
        userId: mockUserId as UserId,
        parameters: {} as any,
      }))
      assert.deepEqual(mockGolfState.players.length, 1)
      assert.deepEqual(mockGolfState.players[0].userId.value, mockUserId)
    })

    it('should not remove player from state on disconnect', () => {
      receptorPlayerLeave(mockGolfState, GolfAction.playerLeave({
        userId: mockUserId as UserId
      }))
      assert.deepEqual(mockGolfState.players.length, 1)
      assert.deepEqual(mockGolfState.players[0].userId.value, mockUserId)
    })

    it('should not add player again on reconnect', () => {
      receptorSpawnAvatar(mockGolfState, NetworkWorldAction.spawnAvatar({
        userId: mockUserId as UserId,
        parameters: {} as any,
      }))
      assert.deepEqual(mockGolfState.players.length, 1)
      assert.deepEqual(mockGolfState.players[0].userId.value, mockUserId)
    })
  })

  it('next turn progression', () => {
    const world = createWorld()
    Engine.currentWorld = world

    const mockGolfState = mockState()
    const mockUserId1 = MathUtils.generateUUID()

    receptorSpawnAvatar(mockGolfState, NetworkWorldAction.spawnAvatar({
      userId: mockUserId1 as UserId,
      parameters: {} as any,
    }))

    assert.deepEqual(mockGolfState.players.length, 1)
    assert.deepEqual(mockGolfState.players[0].userId.value, mockUserId1)

    receptorBallStopped(mockGolfState, GolfAction.ballStopped({
      userId: mockUserId1 as UserId,
      position: [0, 0, 0],
      inHole: false,
      outOfBounds: false
    }))

    executeWorld()
  })
})