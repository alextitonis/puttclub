/**
 * @author HydraFire <github.com/HydraFire>
 * @author Josh Field <github.com/hexafield>
 * @author Gheric Speiginer <github.com/speigg>
 */

import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { AssetLoader } from '@xrengine/engine/src/assets/classes/AssetLoader'
import { GolfAction } from './GolfAction'
import { dispatchFrom, dispatchLocal } from '@xrengine/engine/src/networking/functions/dispatchFrom'
import { createState, Downgraded } from '@hookstate/core'
import { isClient } from '@xrengine/engine/src/common/functions/isClient'
import { addComponent, defineQuery, getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { BALL_STATES, initializeGolfBall, resetBall, setBallState, updateBall } from './prefab/GolfBallPrefab'
import { initializeGolfClub, updateClub } from './prefab/GolfClubPrefab'
import { GolfClubComponent } from './components/GolfClubComponent'
import { setupPlayerInput } from './functions/setupPlayerInput'
import { registerGolfBotHooks } from './functions/registerGolfBotHooks'
import {
  getBall,
  getCoursePar,
  getCurrentGolfPlayerEntity,
  getHole,
  getPlayerEntityFromNumber,
  getTee
} from './functions/golfFunctions'
import { hitBall } from './functions/hitBall'
import { GolfBallComponent } from './components/GolfBallComponent'
import { getCollisions } from '@xrengine/engine/src/physics/functions/getCollisions'
import { VelocityComponent } from '@xrengine/engine/src/physics/components/VelocityComponent'
import { GolfHoleComponent } from './components/GolfHoleComponent'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'
import { isEntityLocalClient } from '@xrengine/engine/src/networking/functions/isEntityLocalClient'
import { useState } from '@hookstate/core'
import { GolfTeeComponent } from './components/GolfTeeComponent'
import { NameComponent } from '@xrengine/engine/src/scene/components/NameComponent'
import { setupPlayerAvatar, setupPlayerAvatarNotInVR, setupPlayerAvatarVR } from './functions/setupPlayerAvatar'
import { useWorld } from '@xrengine/engine/src/ecs/functions/SystemHooks'
import matches from 'ts-matches'
import { SpawnPoseComponent } from '@xrengine/engine/src/avatar/components/SpawnPoseComponent'
import { UserId } from '@xrengine/common/src/interfaces/UserId'
import { NetworkWorldAction } from '@xrengine/engine/src/networking/functions/NetworkWorldAction'
import { AvatarComponent } from '@xrengine/engine/src/avatar/components/AvatarComponent'
import { NetworkObjectComponent } from '@xrengine/engine/src/networking/components/NetworkObjectComponent'
import { ResolvedActionShape } from '@xrengine/engine/src/networking/interfaces/Action'

export const GolfHolePars = [] as Array<number>

/**
 *
 */
export const GolfState = createState({
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

export type GolfStateType = typeof GolfState

// Attach logging
GolfState.attach(() => ({
  id: Symbol('Logger'),
  init: () => ({
    onSet(arg) {
      console.log('GOLF STATE \n' + JSON.stringify(GolfState.attach(Downgraded).value, null, 2))
    }
  })
}))

export function accessGolfState() {
  return GolfState.attach(Downgraded).value
}

export function useGolfState() {
  return useState(GolfState) as any as typeof GolfState
}

const getTeePosition = (currentHole: number) => {
  const teeEntity = getTee(currentHole)
  return getComponent(teeEntity, TransformComponent).position.toArray()
}

export const receptorSpawnAvatar = (s: GolfStateType, action: ReturnType<typeof NetworkWorldAction.spawnAvatar>) => {
  const { userId } = action
  const playerAlreadyExists = s.players.find((p) => p.userId.value === userId)
  if (playerAlreadyExists) {
    playerAlreadyExists.merge({ isConnected: true })
    console.log(`player ${userId} rejoined`)
  } else {
    s.players.merge([
      {
        userId: userId,
        scores: [],
        stroke: 0,
        viewingScorecard: false,
        viewingCourseScore: false,
        isConnected: true
      }
    ])
    console.log(`player ${userId} joined`)
  }
  const world = useWorld()
  dispatchFrom(world.hostId, () => GolfAction.sendState({ state: s.attach(Downgraded).value })).to(userId)
  dispatchFrom(world.hostId, () => GolfAction.spawnBall({ userId }))
  dispatchFrom(world.hostId, () => GolfAction.spawnClub({ userId }))
  const entity = world.getUserAvatarEntity(userId)
  setupPlayerAvatar(entity)
  setupPlayerInput(entity)
  const currentPlayer = s.players.find((p) => p.userId.value === s.currentPlayerId.value)
  if (s.players.value.length === 0 || !currentPlayer || !currentPlayer.isConnected.value) {
    s.currentPlayerId.set(userId)
  }
}

// IMPORTANT : For FLUX pattern, consider state immutable outside a receptor
export function golfReceptor(action) {
  const world = useWorld()

  // console.log(action)

  GolfState.batch((s: GolfStateType) => {
    matches(action)
      .when(GolfAction.sendState.matches, ({ state }) => {
        s.set(state)
      })

      /**
       * On PLAYER_JOINED
       * - Add a player to player list (start at hole 0, scores at 0 for all holes)
       * - spawn golf club
       * - spawn golf ball
       */
      .when(NetworkWorldAction.spawnAvatar.matches, action => receptorSpawnAvatar(s, action))

      // Setup player XR avatars
      .when(NetworkWorldAction.setXRMode.matchesFromAny, (a) => {
        if (!isClient) return
        const entity = world.getUserAvatarEntity(a.userId)
        if (a.enabled) setupPlayerAvatarVR(entity)
        else setupPlayerAvatarNotInVR(entity)
      })

      /**
       * on PLAYER_STROKE
       *   - Finish current hole for this player
       *   - players[currentPlayer].scores[currentHole] = player.stroke
       */
      .when(GolfAction.playerStroke.matchesFromUser(s.currentPlayerId.value), ({ $from }) => {
        const p = s.players.find((c) => c.userId.value === $from)!
        console.log('incremented stoke', p)
        p.merge((s) => {
          return { stroke: s.stroke + 1 }
        })
        setBallState(getBall($from), BALL_STATES.MOVING)
        if (world.isHosting) ballTimer = 0
      })

      /**
       * on spawn Goll ball
       */
      .when(GolfAction.spawnBall.matches, (action) => {
        console.log('MAKING BALL')

        let entityBall = getBall(action.userId)
        if (entityBall) {
          console.warn('The ball entity already exist for user', action.userId)
        } else {
          entityBall = initializeGolfBall(action)
        }

        if (s.currentPlayerId.value === action.userId) {
          setBallState(entityBall, BALL_STATES.WAITING)
        } else {
          setBallState(entityBall, BALL_STATES.INACTIVE)
        }
      })

      /**
       * on spawn Golf club
       */
      .when(GolfAction.spawnClub.matches, (action) => {
        console.log('MAKING CLUB')
        initializeGolfClub(action)
      })

      /**
       * on BALL_STOPPED
       *   - Finish current hole for this player
       *   - players[currentPlayer].scores[currentHole] = player.stroke
       */
      .when(GolfAction.ballStopped.matches, ({ userId }) => {
        const entityBall = getBall(userId)
        setBallState(entityBall, action.inHole ? BALL_STATES.IN_HOLE : BALL_STATES.STOPPED)
        if (isClient) {
          const teePosition = getTeePosition(s.currentHole.value)
          const position = action.outOfBounds ? teePosition : action.position
          resetBall(entityBall, position)
        }
        dispatchFrom(world.hostId, () => GolfAction.nextTurn({ userId }))
      })

      /**
       * on NEXT_TURN
       *   - next player is first of reduce(players => ball not in hole)
       *   - IF all balls in hole
       *     - Finish current hole for this player
       *     - players[currentPlayer].scores[currentHole] = player.stroke
       *     - IF all players have finished the current hole
       *       - dispatch NEXT_HOLE
       *   - ELSE
       *     - increment currentPlayer
       *     - hide old player's ball
       *     - show new player's ball
       */
      .when(GolfAction.nextTurn.matches, ({ userId }) => {
        const currentPlayerId = s.currentPlayerId.value
        const currentPlayerIndex = s.players.findIndex((c) => c.userId.value === currentPlayerId)!
        const currentPlayerState = s.players[currentPlayerIndex]
        const currentHole = s.currentHole.value

        const stroke = currentPlayerState.stroke.value

        const par = getCoursePar(currentHole)
        const overParLimit = 3 // todo: expose as external config?

        const entityBall = getBall(userId)
        // If the player leaves, the ball will be removed also
        if (entityBall) {
          const { state } = getComponent(entityBall, GolfBallComponent)
          console.log('state', state)
          if (
            // if ball is in hole
            state === BALL_STATES.IN_HOLE ||
            // or player is over the par limit
            stroke >= par + overParLimit
          ) {
            // finish their round
            const total = stroke - par
            currentPlayerState.scores.set([...currentPlayerState.scores.value, total])
            dispatchFrom(world.hostId, () => GolfAction.showCourseScore({ userId }))
          }

          setBallState(entityBall, BALL_STATES.INACTIVE)
        }

        // get players who haven't finished yet
        const playerSequence = s.players.value
          .slice(currentPlayerIndex)
          .concat(s.players.value.slice(0, currentPlayerIndex)) // wrap
        console.log('\n\nplayerSequence', playerSequence, currentPlayerIndex, currentHole, '\n\n')
        const nextPlayer = playerSequence.filter((p) => {
          console.log(p)
          return p.scores.length <= currentHole && p.isConnected
        })[0]

        console.log('nextPlayer', nextPlayer)

        // if we have a next player, increment the current player and change turns
        if (nextPlayer) {
          s.currentPlayerId.set(nextPlayer.userId)

          // the ball might be in the old hole still
          if (nextPlayer.stroke === 0) {
            if (!isClient)
              dispatchFrom(world.hostId, () =>
                GolfAction.resetBall({
                  userId: nextPlayer.userId,
                  position: getTeePosition(s.currentHole.value)
                })
              )
          }

          const nextBallEntity = getBall(nextPlayer.userId)
          setBallState(nextBallEntity, BALL_STATES.WAITING)
          console.log(`it is now player ${nextPlayer.userId}'s turn`)
        } else {
          // if not, the round has finished
          if (!isClient) dispatchFrom(world.hostId, () => GolfAction.nextHole({}))
        }
      })

      /**
       * on NEXT_HOLE
       *   - currentHole = earliest hole that a player hasn’t completed yet
       *   - indicate new current hole
       *   - dispatch RESET_BALL
       */
      .when(GolfAction.nextHole.matches, () => {
        s.currentHole.set((s.currentHole.value + 1) % GolfHolePars.length) // TODO: earliest incomplete hole
        if (s.currentHole.value === 0) {
          console.log('finished game! resetting player scores')
          for (const [i, p] of s.players.entries()) {
            p.scores.set([])
          }
        }
        // Set all player strokes to 0
        for (const [i, p] of s.players.entries()) {
          p.stroke.set(0)
          // reset all ball position to the new tee
        }

        if (isClient) {
          const teeEntity = getTee(s.currentHole.value)
          getComponent(world.localClientEntity, SpawnPoseComponent).position.copy(
            getComponent(teeEntity, TransformComponent).position
          )
        }

        // set current player to the first player
        s.currentPlayerId.set(s.players[0].userId.value)
        if (!isClient)
          dispatchFrom(world.hostId, () =>
            GolfAction.resetBall({
              userId: s.players[0].userId.value,
              position: getTeePosition(s.currentHole.value)
            })
          )
      })

      /**
       * on RESET_BALL
       * - teleport ball
       */
      .when(GolfAction.resetBall.matches, ({ userId }) => {
        const entityBall = getBall(userId)
        if (typeof entityBall !== 'undefined') {
          resetBall(entityBall, action.position)
          setBallState(entityBall, BALL_STATES.WAITING)
        }
      })

      /**
       * Show scorecard
       */
      .when(GolfAction.lookAtScorecard.matchesFromAny, ({ userId, value }) => {
        const player = s.players.find((p) => p.userId.value === userId)
        if (player) player.viewingScorecard.set((v) => (typeof value === 'boolean' ? value : !v))
      })

      /**
       * Show score for the course
       */
      .when(GolfAction.showCourseScore.matches, ({ userId }) => {
        const player = s.players.find((p) => p.userId.value === userId)
        if (player) player.viewingCourseScore.set((v) => (typeof action.value === 'boolean' ? action.value : !v))
      })

      /**
       * If a player leaves on their turn,
       */
      .when(GolfAction.playerLeave.matches, ({ userId }) => {
        s.players.find((p) => p.userId.value === userId)?.merge({ isConnected: false })
        if (userId === s.currentPlayerId.value) {
          dispatchFrom(world.hostId, () =>
            GolfAction.resetBall({
              userId,
              position: getTeePosition(s.currentHole.value)
            })
          )
          dispatchFrom(world.hostId, () => GolfAction.nextTurn({ userId }))
        }
      })
  })
}

// Note: player numbers are 0-indexed

globalThis.GolfState = GolfState
let ballTimer = 0

export default async function GolfSystem(world: World) {
  world.receptors.push(golfReceptor)

  const namedComponentQuery = defineQuery([NameComponent])
  const avatarComponentQuery = defineQuery([AvatarComponent])
  const golfClubQuery = defineQuery([GolfClubComponent])

  if (isClient) {
    registerGolfBotHooks()
    // pre-cache the assets we need for this game
    await Promise.all([
      AssetLoader.loadAsync({ url: Engine.publicPath + '/projects/puttclub/avatars/avatar_head.glb' }),
      AssetLoader.loadAsync({ url: Engine.publicPath + '/projects/puttclub/avatars/avatar_hands.glb' }),
      AssetLoader.loadAsync({ url: Engine.publicPath + '/projects/puttclub/avatars/avatar_torso.glb' }),
      AssetLoader.loadAsync({ url: Engine.publicPath + '/projects/puttclub/golf_ball.glb' })
    ])
  }

  return () => {
    for (const entity of avatarComponentQuery.exit()) {
      const { userId } = getComponent(entity, NetworkObjectComponent, true)
      dispatchFrom(world.hostId, () => GolfAction.playerLeave({ userId }))
    }

    for (const entity of golfClubQuery()) {
      const { number } = getComponent(entity, GolfClubComponent)
      const ownerEntity = getPlayerEntityFromNumber(number)
      updateClub(entity)
      // we only need to detect hits for our own club
      if (isEntityLocalClient(ownerEntity)) {
        if (getCurrentGolfPlayerEntity() === ownerEntity) {
          const currentPlayerId = accessGolfState().currentPlayerId
          const entityBall = getBall(currentPlayerId)
          if (entityBall) {
            const { collisionEntity } = getCollisions(entity, GolfBallComponent)
            if (collisionEntity !== null && collisionEntity === entityBall) {
              const golfBallComponent = getComponent(entityBall, GolfBallComponent)
              if (golfBallComponent.state === BALL_STATES.WAITING) {
                hitBall(entity, entityBall)
                setBallState(entityBall, BALL_STATES.MOVING)
                dispatchFrom(Engine.userId, () => GolfAction.playerStroke({}))
              }
            }
          }
        }
      }
    }

    for (const entity of namedComponentQuery.enter()) {
      const { name } = getComponent(entity, NameComponent)
      if (name) {
        console.log(name)
        if (name.includes('GolfHole')) {
          addComponent(entity, GolfHoleComponent, {})
        }
        if (name.includes('GolfTee')) {
          const { par } = getComponent(entity, GolfTeeComponent)
          console.log('par', par)
          GolfHolePars.push(par)
        }
      }
    }

    const currentPlayerId = accessGolfState().currentPlayerId
    const activeBallEntity = getBall(currentPlayerId)
    if (activeBallEntity !== undefined) {
      const golfBallComponent = getComponent(activeBallEntity, GolfBallComponent)
      updateBall(activeBallEntity)

      if (!isClient && golfBallComponent.state === BALL_STATES.MOVING) {
        const { velocity } = getComponent(activeBallEntity, VelocityComponent)
        console.log('ball velocity', velocity)
        ballTimer++
        if (ballTimer > 60) {
          // const { velocity } = getComponent(activeBallEntity, VelocityComponent)
          // console.log(velocity)
          const position = getComponent(activeBallEntity, TransformComponent)?.position
          if (!position) return
          const velMag = velocity.lengthSq()
          if (velMag < 0.001 || position.y < -100 || ballTimer > 60 * 5) {
            setBallState(activeBallEntity, BALL_STATES.STOPPED)
            setTimeout(() => {
              const position = getComponent(activeBallEntity, TransformComponent)?.position
              golfBallComponent.groundRaycast.origin.copy(position)
              world.physics.doRaycast(golfBallComponent.groundRaycast)
              const outOfBounds = !golfBallComponent.groundRaycast.hits.length
              const activeHoleEntity = getHole(accessGolfState().currentHole)
              if (!position) return
              const { collisionEvent } = getCollisions(activeBallEntity, GolfHoleComponent)
              const dist = position.distanceToSquared(getComponent(activeHoleEntity, TransformComponent).position)
              // ball-hole collision not being detected, not sure why, use dist for now
              const inHole = dist < 0.01 //typeof collisionEvent !== 'undefined'
              console.log(getComponent(activeHoleEntity, TransformComponent).position)
              console.log('\n\n\n========= ball stopped', outOfBounds, inHole, dist, collisionEvent, '\n')

              dispatchFrom(world.hostId, () =>
                GolfAction.ballStopped({
                  userId: currentPlayerId,
                  position: position.toArray(),
                  inHole,
                  outOfBounds
                })
              )
            }, 1000)
          }
        }
      }
    }

    return world
  }
}
