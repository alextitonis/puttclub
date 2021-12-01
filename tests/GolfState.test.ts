import { createState } from '@hookstate/core'
import { dispatchFrom } from '@xrengine/engine/src/networking/functions/dispatchFrom'
import { NetworkWorldAction } from '@xrengine/engine/src/networking/functions/NetworkWorldAction'
import { UserId } from '@xrengine/common/src/interfaces/UserId'
import assert from 'assert'
import { MathUtils } from 'three'
import { createWorld, World } from '@xrengine/engine/src/ecs/classes/World'
import { useEngine } from '@xrengine/engine/src/ecs/classes/Engine'
import { createGolfReceptor, receptorBallStopped, receptorNextHole, receptorPlayerLeave, receptorSpawnAvatar } from '../GolfStateReceptors'
import { GolfAction } from '../GolfAction'
import { mockProgressWorldForNetworkActions } from '@xrengine/engine/tests/networking/NetworkTestHelpers'
import { Network } from '@xrengine/engine/src/networking/classes/Network'
import { TestNetwork } from "@xrengine/engine/tests/networking/TestNetwork"

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

const mockGolfReceptorWithState = (state, receptor) => {
  return (action) => {
    console.log(state, receptor, action)
    state.batch(s => receptor(s, action))
  }
}

describe('Golf State', () => {

  afterEach(() => {
    useEngine().defaultWorld = null!
    useEngine().currentWorld = null!
  })
  
  beforeEach(() => {
    const world = createWorld()
    useEngine().currentWorld = world
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
      assert.equal(mockGolfState.currentPlayerId.value, mockUserId)
    })

    it('should not remove player from state on disconnect', () => {
      receptorPlayerLeave(mockGolfState, GolfAction.playerLeave({
        userId: mockUserId as UserId
      }))
      assert.deepEqual(mockGolfState.players.length, 1)
      assert.deepEqual(mockGolfState.players[0].userId.value, mockUserId)
      assert.equal(mockGolfState.currentPlayerId.value, mockUserId)
    })

    it('should not add player again on reconnect', () => {
      receptorSpawnAvatar(mockGolfState, NetworkWorldAction.spawnAvatar({
        userId: mockUserId as UserId,
        parameters: {} as any,
      }))
      assert.deepEqual(mockGolfState.players.length, 1)
      assert.deepEqual(mockGolfState.players[0].userId.value, mockUserId)
      assert.equal(mockGolfState.currentPlayerId.value, mockUserId)
    })
  })

  describe('next turn progression', () => {
    const world = createWorld()
    useEngine().currentWorld = world
    useEngine().currentWorld.fixedTick = 0
    useEngine().currentWorld.hostId = 'server' as any
    Network.instance = new TestNetwork()

    const mockGolfState = mockState()
    const mockUserId1 = MathUtils.generateUUID()
    const mockUserId2 = MathUtils.generateUUID()

    it('single player', () => {
      receptorSpawnAvatar(mockGolfState, NetworkWorldAction.spawnAvatar({
        userId: mockUserId1 as UserId,
        parameters: {} as any,
      }))

      assert.deepEqual(mockGolfState.players.length, 1)
      assert.deepEqual(mockGolfState.players[0].userId.value, mockUserId1)
      assert.equal(mockGolfState.currentPlayerId.value, mockUserId1)

      receptorBallStopped(mockGolfState, GolfAction.ballStopped({
        userId: mockUserId1 as UserId,
        position: [0, 0, 0],
        inHole: false,
        outOfBounds: false
      }))

      assert.equal(mockGolfState.currentPlayerId.value, mockUserId1)
    })

    it('second player', () => {
      receptorSpawnAvatar(mockGolfState, NetworkWorldAction.spawnAvatar({
        userId: mockUserId2 as UserId,
        parameters: {} as any,
      }))

      assert.deepEqual(mockGolfState.players.length, 2)
      assert.deepEqual(mockGolfState.players[0].userId.value, mockUserId1)
      assert.deepEqual(mockGolfState.players[1].userId.value, mockUserId2)
      assert.equal(mockGolfState.currentPlayerId.value, mockUserId1)

      receptorBallStopped(mockGolfState, GolfAction.ballStopped({
        userId: mockUserId1 as UserId,
        position: [0, 0, 0],
        inHole: false,
        outOfBounds: false
      }))

      useEngine().currentWorld!.receptors = [mockGolfReceptorWithState(mockGolfState, receptorNextHole)]!

      mockProgressWorldForNetworkActions()
      console.log(mockGolfState.value)
      assert.equal(mockGolfState.currentPlayerId.value, mockUserId2)
    })
  })
})