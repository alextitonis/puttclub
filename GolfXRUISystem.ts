import { isClient } from '@xrengine/engine/src/common/functions/isClient'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { pipe } from 'bitecs'

export default async function GolfXRUISystem(world: World) {

  // TODO: this is temp, until reality packs have browser & node options
  if(!isClient) return () => {}

  const { GolfPlayerUISystem } = await import('./GolfPlayerUISystem')
  const { GolfScorecardUISystem } = await import('./GolfScorecardUISystem')
  const { GolfCourseScoreUISystem } = await import('./GolfCourseScoreUISystem')

  const playerUISystem = await GolfPlayerUISystem(world)
  const scoreboardUISystem = await GolfScorecardUISystem(world)
  const courseScoreUISystem = await GolfCourseScoreUISystem(world)
  return pipe(
    playerUISystem,
    scoreboardUISystem,
    courseScoreUISystem
  )
}
