import { State, useState } from '@hookstate/core'
import { useUserState } from '@xrengine/client-core/src/user/services/UserService'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { Entity } from '@xrengine/engine/src/ecs/classes/Entity'
import { getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { XRUIComponent } from '@xrengine/engine/src/xrui/components/XRUIComponent'
import { createXRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import React from 'react'
import { MathUtils } from 'three'
import { getGolfPlayerNumber } from './functions/golfFunctions'
import { GolfColours } from './GolfGameConstants'
import { GolfState } from './GolfSystem'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { UserId } from '@xrengine/common/src/interfaces/UserId'
import { LocalGolfState } from './GolfSystem'

export function createScorecardUI() {
  return createXRUI(GolfScorecardView, GolfState)
}

function getUserById(id: UserId, userState: ReturnType<typeof useUserState>) {
  return userState.layerUsers.find((user) => user.id.value === id)
}

const GolfLabelColumn = () => {
  const userState = useUserState()
  const players = useState(GolfState.players)
  return (
    <>
    <style>{`
      #labels {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;
        padding: 15px 10px;
        gap: 10px;
        position: static;
        width: fit-content;
        height: fit-content;
        text-align: right;
        color: #FFFFFF;
      }

      .playerLabel {
        position: static;
        height: 40px;
        font-size: 30px;
        line-height: 38px;
        align-items: center;
        white-space: nowrap;
        width: fit-content;
      }
    `}</style>
    <div id="labels" xr-layer="true">
      <div
        style={{
          position: 'static',
          height: '40px',
          fontSize: '30px',
          lineHeight: '38px'
        }}
      >
        Hole
      </div>
      <div
        style={{
          position: 'static',
          height: '40px',
          fontSize: '18px',
          lineHeight: '19px'
        }}
      >
        Par
      </div>
      {players.map((p, i) => {
        // console.log('PLAYER ' + p.id.value)
        const color = GolfColours[i]
        return (
          <div
            key={i}
            className="playerLabel"
            style={{
              color: color.getStyle()
            }}
          >
            {getUserById(p.userId.value, userState)?.name.value || `Player${i}`}
          </div>
        )
      })}
    </div>
    </>
  )
}

const GolfScoreBox = (props: { scoreState: State<number | undefined> }) => {
  const score = useState(props.scoreState).value
  return (
    <div className="scorebox">
      {score ?? '-'}
    </div>
  )
}

const GolfHoleColumn = (props: { hole: number }) => {
  const players = useState(GolfState.players)
  const par = useState(LocalGolfState.golfHolePars[props.hole])
  return (
    <div className="hole-column" xr-layer="true">
      <div className="hole">
        {props.hole}
      </div>
      <div className="par">
        {par.value}
      </div>
      {players.map((p, i) => (
        <GolfScoreBox key={i} scoreState={p.scores[props.hole]}></GolfScoreBox>
      ))}
    </div>
  )
}

const GolfFinalScoreColumn = () => {
  return <></>
}

const GolfScorecardView = () => {
  const pars = useState(LocalGolfState.golfHolePars)
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto"></link>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Racing+Sans+One"></link>
      <style>{`
        #scorecard {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 30px 40px;
          position: relative;
          width: fit-content;
          height: fit-content;
          background-color: #000000dd;
          border: 8px solid #FFFFFF;
          box-sizing: border-box;
          box-shadow: #fff2 0 0 30px;
          border-radius: 60px;
          margin: 80px;
          font-family: Racing Sans One;
          font-style: normal;
          font-weight: normal;
        }

        .hole-column {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: center;
          padding: 10px 0;
          gap: 10px;
          color: white;
          padding-left: 10px;
        }

        .hole {
          width: 40px;
          height: 40px;
          border: 4px solid #FFFFFF;
          box-sizing: border-box;
          border-radius: 20px;
          line-height: 32px;
          font-size: 20px;
        }

        .par {
          width: 40px;
          height: 40px;
          font-size: 18px;
          line-height: 30px;
        }

        .scorebox {
          width: 40px;
          height: 40px;
          background: rgba(0,0,0,0.3);
          border-radius: 9px;
          font-family: Roboto;
          font-style: normal;
          font-weight: normal;
          font-size: 32px;
        }
        
      `}</style>
      <div id="scorecard">
        <GolfLabelColumn />
        {pars.map((h, i) => (
          <GolfHoleColumn key={i} hole={i}></GolfHoleColumn>
        ))}
        <GolfFinalScoreColumn></GolfFinalScoreColumn>
      </div>
    </>
  )
}

export const GolfScorecardUISystem = async (world: World) => {
  const ui = createScorecardUI()

  return () => {
    const uiComponent = getComponent(ui.entity, XRUIComponent)
    if (!uiComponent) return

    const layer = uiComponent.layer
    layer.position.set(0, 0, -0.5)
    layer.quaternion.set(0, 0, 0, 1)
    layer.scale.setScalar(0.6)
    layer.matrix.compose(layer.position, layer.quaternion, layer.scale).premultiply(Engine.camera.matrixWorld)
    layer.matrix.decompose(layer.position, layer.quaternion, layer.scale)

    const localPlayerNumber = getGolfPlayerNumber(Engine.userId)
    const viewingScorecard = GolfState.players.value[localPlayerNumber]?.viewingScorecard
    // console.log(GolfState.players[localPlayerNumber].viewingScorecard)

    const targetOpacity = viewingScorecard ? 1 : 0
    layer.rootLayer.traverseLayersPreOrder((layer) => {
      layer.contentMesh.material.opacity = MathUtils.lerp(
        layer.contentMesh.material.opacity,
        targetOpacity,
        world.delta * 10
      )
      layer.contentMesh.material.needsUpdate = true
    })

    // uiComponent.layer.querySelector()

    // uiTransform.rotation.copy(cameraTransform.rotation)
    // uiTransform.position.copy(cameraTransform.position)
    // uiTransform.position.z = -10
    // ui.z
    // uiTransform.scale.setScalar(Math.max(1, Engine.camera.position.distanceTo(avatarTransform.position) / 3))
    // uiTransform.position.copy(avatarTransform.position)
    // uiTransform.position.y += avatarHeight + 0.3
  }
}

const GolfScorecardUI = new Map<Entity, ReturnType<typeof createScorecardUI>>()
