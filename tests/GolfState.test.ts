import { createState } from '@hookstate/core'
import { dispatchFrom } from '@xrengine/engine/src/networking/functions/dispatchFrom'
import { NetworkWorldAction } from '@xrengine/engine/src/networking/functions/NetworkWorldAction'
import { UserId } from '@xrengine/common/src/interfaces/UserId'
import assert from 'assert'
import { MathUtils } from 'three'
import { createWorld, World } from '@xrengine/engine/src/ecs/classes/World'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { createGolfReceptor, receptorBallStopped, receptorNextHole, receptorPlayerLeave, receptorClientCreate } from '../GolfStateReceptors'
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
      receptorClientCreate(mockGolfState, NetworkWorldAction.spawnAvatar({
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
      receptorClientCreate(mockGolfState, NetworkWorldAction.spawnAvatar({
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
    Engine.currentWorld = world
    Engine.currentWorld.fixedTick = 0
    Engine.currentWorld.hostId = 'server' as any
    Network.instance = new TestNetwork()

    const mockGolfState = mockState()
    const mockUserId1 = MathUtils.generateUUID()
    const mockUserId2 = MathUtils.generateUUID()

    it('single player', () => {
      receptorClientCreate(mockGolfState, NetworkWorldAction.spawnAvatar({
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
      receptorClientCreate(mockGolfState, NetworkWorldAction.spawnAvatar({
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

      Engine.currentWorld!.receptors = [mockGolfReceptorWithState(mockGolfState, receptorNextHole)]!

      mockProgressWorldForNetworkActions()
      console.log(mockGolfState.value)
      assert.equal(mockGolfState.currentPlayerId.value, mockUserId2)
    })
  })
})