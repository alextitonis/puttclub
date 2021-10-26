import React from 'react'
import World from '@xrengine/client/src/components/World/index'

export const HomePage = (props): any => {
  console.log('puttclub homepage')

    return (
      <World allowDebug={true} locationName='golf' history={props.history} showTouchpad />
    )
}

export default HomePage