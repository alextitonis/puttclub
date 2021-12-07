/**
 * @author HydraFire <github.com/HydraFire>
 * @author Josh Field <github.com/hexafield>
 * @author Gheric Speiginer <github.com/speigg>
 */

import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { AssetLoader } from '@xrengine/engine/src/assets/classes/AssetLoader'
import { GolfAction } from './GolfAction'
import { dispatchFrom } from '@xrengine/engine/src/networking/functions/dispatchFrom'
import { createState, Downgraded } from '@hookstate/core'
import { isClient } from '@xrengine/engine/src/common/functions/isClient'
import { addComponent, defineQuery, getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { BALL_STATES, setBallState, updateBall } from './prefab/GolfBallPrefab'
import { updateClub } from './prefab/GolfClubPrefab'
import { GolfClubComponent } from './components/GolfClubComponent'
import { registerGolfBotHooks } from './functions/registerGolfBotHooks'
import {
  getBall,
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
import { UserId } from '@xrengine/common/src/interfaces/UserId'
import { AvatarComponent } from '@xrengine/engine/src/avatar/components/AvatarComponent'
import { NetworkObjectComponent } from '@xrengine/engine/src/networking/components/NetworkObjectComponent'
import { createGolfReceptor } from './GolfStateReceptors'

export const LocalGolfState = createState({
  ballTimer: 0,
  ballVelocityTimer: 0,
  golfHolePars: [] as Array<number>
})

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
  currentHole: 5
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

export const getTeePosition = (currentHole: number) => {
  const teeEntity = getTee(currentHole)
  return getComponent(teeEntity, TransformComponent).position.toArray()
}

// Note: player numbers are 0-indexed

globalThis.GolfState = GolfState
globalThis.LocalGolfState = LocalGolfState

export default async function GolfSystem(world: World) {
  world.receptors.push(createGolfReceptor(GolfState))

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
              //hit ball
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
          LocalGolfState.golfHolePars.merge([par])
        }
      }
    }

    const currentPlayerId = accessGolfState().currentPlayerId
    const activeBallEntity = getBall(currentPlayerId)
    if (activeBallEntity !== undefined) {
      const golfBallComponent = getComponent(activeBallEntity, GolfBallComponent)
      updateBall(activeBallEntity)

      if (!isClient && golfBallComponent?.state === BALL_STATES.MOVING) {
        const { velocity } = getComponent(activeBallEntity, VelocityComponent)
        console.log('ball velocity', velocity)
        LocalGolfState.ballTimer.set(LocalGolfState.ballTimer.value+1)
        if (LocalGolfState.ballTimer.value > 60) {
          // const { velocity } = getComponent(activeBallEntity, VelocityComponent)
          // console.log(velocity)
          const position = getComponent(activeBallEntity, TransformComponent)?.position
          if (!position) return
          const velMag = velocity.lengthSq()
          LocalGolfState.ballVelocityTimer.set((val) => val += velMag < 0.001 ? 1 : 0)
          const ballStopped = LocalGolfState.ballVelocityTimer.value > 60 || position.y < -100 || LocalGolfState.ballTimer.value > 60 * 5
          console.log(LocalGolfState.ballVelocityTimer.value, position.y, LocalGolfState.ballTimer.value)
          if (ballStopped) {
            LocalGolfState.ballVelocityTimer.set(0)
            setBallState(activeBallEntity, BALL_STATES.STOPPED)
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
            


          }
        }
      }
    }

    return world
  }
}
