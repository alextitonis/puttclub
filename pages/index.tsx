import React, { useState } from 'react'
import World from '@xrengine/client/src/components/World/index'
import AvatarInputSwitch from '@xrengine/client-core/src/world/components/Avatar/AvatarInputSwitch'
import { EngineEvents } from '@xrengine/engine/src/ecs/classes/EngineEvents'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import PlayButton from './components/PlayButton/PlayButton'

export const HomePage = (props): any => {
  const [joinedWorld, setJoinedWorld] = useState(false)
  const [inputsEnabled, setInputsEnabled] = useState(false)

  EngineEvents.instance.once(EngineEvents.EVENTS.JOINED_WORLD, () => {
    setTimeout(() => {
      setJoinedWorld(true)
    }, 1000)
  })

  const handlePlayNowClick = () => {
    if (!joinedWorld) return

    setInputsEnabled(true)
    if (Engine.xrSupported) {
      EngineEvents.instance.dispatchEvent({ type: EngineEvents.EVENTS.XR_START })
    }
  }

  return (
    <>
      {!inputsEnabled ? <PlayButton onclick={handlePlayNowClick} /> : <></>}
      <World locationName="golf" history={props.history} connectToInstanceServer={false} />
      <AvatarInputSwitch enabled={inputsEnabled} joinedWorld={joinedWorld} />
    </>
  )
}

export default HomePage
