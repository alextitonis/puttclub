import { createMappedComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'

export type GolfTeeComponentType = {
  par: number
}

export const GolfTeeComponent = createMappedComponent<GolfTeeComponentType>('GolfTeeComponent')
