import { Downgraded } from "@hookstate/core"
import { SpawnPoseComponent } from "@xrengine/engine/src/avatar/components/SpawnPoseComponent"
import { isClient } from "@xrengine/engine/src/common/functions/isClient"
import { getComponent } from "@xrengine/engine/src/ecs/functions/ComponentFunctions"
import { useWorld } from "@xrengine/engine/src/ecs/functions/SystemHooks"
import { dispatchFrom } from "@xrengine/engine/src/networking/functions/dispatchFrom"
import { NetworkWorldAction } from "@xrengine/engine/src/networking/functions/NetworkWorldAction"
import { matches } from "@xrengine/engine/src/networking/interfaces/Action"
import { TransformComponent } from "@xrengine/engine/src/transform/components/TransformComponent"
import { GolfBallComponent } from "./components/GolfBallComponent"
import { getBall, getCoursePar, getTee } from "./functions/golfFunctions"
import { setupPlayerAvatar, setupPlayerAvatarNotInVR, setupPlayerAvatarVR } from "./functions/setupPlayerAvatar"
import { setupPlayerInput } from "./functions/setupPlayerInput"
import { GolfAction } from "./GolfAction"
import { getTeePosition, LocalGolfState, GolfStateType } from "./GolfSystem"
import { BALL_STATES, initializeGolfBall, resetBall, setBallState } from "./prefab/GolfBallPrefab"
import { initializeGolfClub } from "./prefab/GolfClubPrefab"

// IMPORTANT : For FLUX pattern, consider state immutable outside a receptor
export function createGolfReceptor (golfState: GolfStateType) {
  return function golfReceptor (action) {
    golfState.batch((s: GolfStateType) => {
      matches(action)
        .when(GolfAction.sendState.matches, ({ state }) => {
          s.set(state)
        })
        .when(NetworkWorldAction.spawnAvatar.matches, action => receptorSpawnAvatar(s, action))
        .when(NetworkWorldAction.setXRMode.matchesFromAny, action => receptorSetXRMode(s, action))
        .when(GolfAction.playerStroke.matchesFromUser(s.currentPlayerId.value), action => receptorPlayerStroke(s, action))
        .when(GolfAction.spawnBall.matches, action => receptorSpawnBall(s, action))
        .when(GolfAction.spawnClub.matches, action => receptorSpawnClub(s, action))
        .when(GolfAction.ballStopped.matches, action => receptorBallStopped(s, action))
        .when(GolfAction.nextTurn.matches, action => receptorNextTurn(s, action))
        .when(GolfAction.nextHole.matches, action => receptorNextHole(s, action))
        .when(GolfAction.resetBall.matches, action => receptorResetBall(s, action))
        .when(GolfAction.lookAtScorecard.matchesFromAny, action => receptorLookAtScoreboard(s, action))
        .when(GolfAction.showCourseScore.matches, action => receptorShowCourseScore(s, action))
        .when(GolfAction.playerLeave.matches, action => receptorPlayerLeave(s, action))
    })
  }
}

/**
 * On PLAYER_JOINED
 * - Add a player to player list (start at hole 0, scores at 0 for all holes)
 * - spawn golf club
 * - spawn golf ball
 */
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

export const receptorSetXRMode = (s: GolfStateType, action: ReturnType<typeof NetworkWorldAction.setXRMode>) => {
  if (!isClient) return
  const world = useWorld()
  const entity = world.getUserAvatarEntity(action.userId)
  if (action.enabled) setupPlayerAvatarVR(entity)
  else setupPlayerAvatarNotInVR(entity)
}

/**
 * on PLAYER_STROKE
 *   - Finish current hole for this player
 *   - players[currentPlayer].scores[currentHole] = player.stroke
 */
export const receptorPlayerStroke = (s: GolfStateType, action: ReturnType<typeof GolfAction.playerStroke>) => {
  const world = useWorld()
  const p = s.players.find((c) => c.userId.value === action.$from)!
  console.log('incremented stoke', p)
  p.merge((s) => {
    return { stroke: s.stroke + 1 }
  })
  setBallState(getBall(action.$from), BALL_STATES.MOVING)
  if (world.isHosting) LocalGolfState.ballTimer = 0
}

/**
 * on spawn Goll ball
 */
export const receptorSpawnBall = (s: GolfStateType, action: ReturnType<typeof GolfAction.spawnBall>) => {
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
}
/**
 * on spawn Golf club
 */
export const receptorSpawnClub = (s: GolfStateType, action: ReturnType<typeof GolfAction.spawnClub>) => initializeGolfClub(action)

/**
 * on BALL_STOPPED
 *   - Finish current hole for this player
 *   - players[currentPlayer].scores[currentHole] = player.stroke
 */
export const receptorBallStopped = (s: GolfStateType, action: ReturnType<typeof GolfAction.ballStopped>) => {
  const world = useWorld()
  const entityBall = getBall(action.userId)
  setBallState(entityBall, action.inHole ? BALL_STATES.IN_HOLE : BALL_STATES.STOPPED)
  if (isClient) {
    const teePosition = getTeePosition(s.currentHole.value)
    const position = action.outOfBounds ? teePosition : action.position
    resetBall(entityBall, position)
  }
  dispatchFrom(world.hostId, () => GolfAction.nextTurn({ userId: action.userId }))
}

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
export const receptorNextTurn = (s: GolfStateType, action: ReturnType<typeof GolfAction.nextTurn>) => {
  const world = useWorld()

  const currentPlayerId = s.currentPlayerId.value
  const currentPlayerIndex = s.players.findIndex((c) => c.userId.value === currentPlayerId)!
  const currentPlayerState = s.players[currentPlayerIndex]
  const currentHole = s.currentHole.value

  const stroke = currentPlayerState.stroke.value

  const par = getCoursePar(currentHole)
  const overParLimit = 3 // todo: expose as external config?

  const entityBall = getBall(action.userId)
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
      dispatchFrom(world.hostId, () => GolfAction.showCourseScore({ userId: action.userId, value: true }))
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
}

/**
 * on NEXT_HOLE
 *   - currentHole = earliest hole that a player hasn’t completed yet
 *   - indicate new current hole
 *   - dispatch RESET_BALL
 */
export const receptorNextHole = (s: GolfStateType, action: ReturnType<typeof GolfAction.nextHole>) => {
  const world = useWorld()

  s.currentHole.set((s.currentHole.value + 1) % LocalGolfState.golfHolePars.length) // TODO: earliest incomplete hole
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
}

/**
 * on RESET_BALL
 * - teleport ball
 */
export const receptorResetBall = (s: GolfStateType, action: ReturnType<typeof GolfAction.resetBall>) => {
  const entityBall = getBall(action.userId)
  if (typeof entityBall !== 'undefined') {
    resetBall(entityBall, action.position)
    setBallState(entityBall, BALL_STATES.WAITING)
  }
}

/**
 * Show scorecard
 */
export const receptorLookAtScoreboard = (s: GolfStateType, action: ReturnType<typeof GolfAction.lookAtScorecard>) => {
  const player = s.players.find((p) => p.userId.value === action.userId)
  if (player) player.viewingScorecard.set((v) => (typeof action.value === 'boolean' ? action.value : !v))
}

/**
 * Show score for the course
 */
export const receptorShowCourseScore = (s: GolfStateType, action: ReturnType<typeof GolfAction.showCourseScore>) => {
  const player = s.players.find((p) => p.userId.value === action.userId)
  if (player) player.viewingCourseScore.set((v) => (typeof action.value === 'boolean' ? action.value : !v))
}

/**
 * If a player leaves on their turn,
 */
export const receptorPlayerLeave = (s: GolfStateType, action: ReturnType<typeof GolfAction.playerLeave>) => {
  const world = useWorld()
  s.players.find((p) => p.userId.value === action.userId)?.merge({ isConnected: false })
  if (action.userId === s.currentPlayerId.value) {
    dispatchFrom(world.hostId, () =>
      GolfAction.resetBall({
        userId: action.userId,
        position: getTeePosition(s.currentHole.value)
      })
    )
    dispatchFrom(world.hostId, () => GolfAction.nextTurn({ userId: action.userId }))
  }
}
