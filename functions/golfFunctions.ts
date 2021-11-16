import { UserId } from '@xrengine/common/src/interfaces/UserId'
import { useWorld } from '@xrengine/engine/src/ecs/functions/SystemHooks'
import { getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { GolfTeeComponent } from '../components/GolfTeeComponent'
import { accessGolfState } from '../GolfSystem'

export const getGolfPlayerNumber = (userId: UserId = accessGolfState().currentPlayerId) => {
  // console.log(accessGolfState().players, userId)
  return accessGolfState().players.findIndex((player) => player.userId === userId)
}

export function getGolfPlayerState(userId: UserId = accessGolfState().currentPlayerId) {
  return accessGolfState().players.find((player) => player.userId === userId)
}

export const isCurrentGolfPlayer = (userId: UserId) => {
  return userId === accessGolfState().currentPlayerId
}

export const getCurrentGolfPlayerEntity = () => {
  const currentPlayerId = accessGolfState().currentPlayerId
  return useWorld().getUserAvatarEntity(currentPlayerId)
}

export const getPlayerEntityFromNumber = (number: number) => {
  const playerId = accessGolfState().players[number].userId
  return useWorld().getUserAvatarEntity(playerId)
}

export function getBall(u: UserId) {
  const playerNumber = getGolfPlayerNumber(u)
  return useWorld().namedEntities.get(`GolfBall-${playerNumber}`)!
}
export function getClub(u: UserId) {
  const playerNumber = getGolfPlayerNumber(u)
  return useWorld().namedEntities.get(`GolfClub-${playerNumber}`)!
}

export function getTee(hole: number) {
  return useWorld().namedEntities.get(`GolfTee-${hole}`)!
}
export function getHole(hole: number) {
  return useWorld().namedEntities.get(`GolfHole-${hole}`)!
}

interface ITeeParData {
  par: number
}

export const getCoursePar = (currentHole): number => {
  const { par }: ITeeParData = getComponent(getTee(currentHole), GolfTeeComponent)
  return par
}
