import { NetworkWorldAction } from '@xrengine/engine/src/networking/functions/NetworkWorldAction'
import { defineActionCreator, matchesUserId } from '@xrengine/engine/src/networking/interfaces/Action'
import matches from 'ts-matches'

export const GolfAction = {
  sendState: defineActionCreator({
    type: 'puttclub.GAME_STATE',
    state: matches.any
  }),

  addHole: defineActionCreator({
    type: 'puttclub.ADD_HOLE',
    number: matches.number,
    par: matches.number
  }),

  spawnBall: defineActionCreator({
    ...NetworkWorldAction.spawnObject.actionShape,
    prefab: 'puttclub.ball',
    playerNumber: matches.number
  }),

  spawnClub: defineActionCreator({
    ...NetworkWorldAction.spawnObject.actionShape,
    prefab: 'puttclub.club',
    playerNumber: matches.number
  }),

  playerStroke: defineActionCreator(
    {
      type: 'puttclub.PLAYER_STROKE'
    },
    { allowDispatchFromAny: true }
  ),

  ballStopped: defineActionCreator({
    type: 'puttclub.BALL_STOPPED',
    userId: matchesUserId,
    position: matches.tuple(matches.number, matches.number, matches.number),
    inHole: matches.boolean,
    outOfBounds: matches.boolean
  }),

  nextTurn: defineActionCreator({
    type: 'NEXT_TURN',
    userId: matchesUserId
  }),

  resetBall: defineActionCreator({
    type: 'puttclub.RESET_BALL',
    userId: matchesUserId,
    position: matches.tuple(matches.number, matches.number, matches.number),
    disconnect: matches.boolean
  }),

  nextHole: defineActionCreator({
    type: 'puttclub.NEXT_HOLE'
  }),

  lookAtScorecard: defineActionCreator(
    {
      userId: matchesUserId,
      type: 'puttclub.SHOW_SCORECARD',
      value: matches.some(matches.boolean, matches.literal('toggle'))
    },
    { allowDispatchFromAny: true }
  ),

  showCourseScore: defineActionCreator({
    type: 'puttclub.SHOW_COURSE_SCORE',
    userId: matchesUserId,
    value: matches.some(matches.boolean, matches.literal('toggle'))
  })
}
