import { Vector3 } from 'three'
import { eulerToQuaternion } from '@xrengine/engine/src/common/functions/MathRandomFunctions'
import { getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'
import { GolfBotHooks } from './GolfBotHooks'
import { tweenXRInputSource, updateController } from '@xrengine/engine/src/bot/functions/xrBotHookFunctions'
import { accessGolfState } from '../GolfSystem'
import { isCurrentGolfPlayer, getHole, getBall, getTee } from './golfFunctions'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'

export const GolfBotHookFunctions = {
  [GolfBotHooks.GetBallPosition]: getBallPosition,
  [GolfBotHooks.GetHolePosition]: getHolePosition,
  [GolfBotHooks.GetTeePosition]: getTeePosition,
  [GolfBotHooks.GetIsPlayerTurn]: getIsPlayerTurn,
  [GolfBotHooks.GetIsGoal]: getIsGoal,
  [GolfBotHooks.GetIsBallStopped]: getIsBallStopped,
  [GolfBotHooks.GetIsOutOfCourse]: getIsOutOfCourse,
  [GolfBotHooks.SwingClub]: swingClub
}

export function getIsPlayerTurn() {
  return isCurrentGolfPlayer(Engine.userId)
}

export function getIsGoal() {
  // if (!useWorld().localClientEntity) return false
  // return hasComponent(useWorld().localClientEntity, accessGolfState().Goal)
}

export function getIsOutOfCourse() {
  // const ballEntity = getOwnBall() as Entity
  // return hasComponent(ballEntity, accessGolfState().CheckCourse)
}

export function getIsBallStopped() {
  // const ballEntity = getOwnBall() as Entity
  // return hasComponent(ballEntity, accessGolfState().BallStopped)
}

export function swingClub() {
  return new Promise<void>((resolve) => {
    tweenXRInputSource({
      objectName: 'rightController',
      time: 20,
      positionFrom: new Vector3(0.5, 1, 0.04),
      positionTo: new Vector3(-0.5, 1, 0.04),
      quaternionFrom: eulerToQuaternion(-1.54, 0, 0),
      quaternionTo: eulerToQuaternion(-1.54, 0, 0),
      callback: () => {
        updateController({
          objectName: 'rightController',
          position: new Vector3(0.5, 1, 0.04).toArray(),
          rotation: eulerToQuaternion(-1.54, 0, 0).toArray()
        })
        setTimeout(resolve, 500)
      }
    })
  })
}

export function getTeePosition() {
  const teeEntity = getTee(accessGolfState().currentHole)
  const teeTransform = getComponent(teeEntity, TransformComponent)
  return teeTransform.position
}

export function getHolePosition() {
  const holeEntity = getHole(accessGolfState().currentHole)
  const holeTransform = getComponent(holeEntity, TransformComponent)
  return holeTransform.position
}

export function getBallPosition() {
  const ballEntity = getBall(accessGolfState().currentPlayerId)
  const ballTransform = getComponent(ballEntity, TransformComponent)
  return ballTransform.position
}
