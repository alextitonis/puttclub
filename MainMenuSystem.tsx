import React from 'react'
import { Vector3 } from 'three'

import { GolfState } from './GolfSystem'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { createXRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { XRUIComponent } from '@xrengine/engine/src/xrui/components/XRUIComponent'
import { getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'

const OrangeYellow = "#ffaa22";
const GreyBorder = "#5a5a5a";
const GreyBackground = "#3d3838";

const styles = {
  mainMenuContainer: {
    width: "100%",
    zIndex: 10,
    height: "100%",
    display: "flex",
    position: "fixed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
  },
  menuSection: {
    display: "flex",
    margin: "20px 0px",
    flexDirection: "column",
  },
  logoContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainerImg: {
    width: "35%",
    height: "auto",
  },
  menuContainer: {
    display: "grid",
    gridGap: "20px",
    gridTemplateColumns: "1fr 1fr 1fr",
  },
  leftContainer: {
    margin: "20px",
    padding: "20px",
    display: "grid",
    gridGap: "10px",
    overflow: "visible",
    alignItems: "center",
    justifyContent: "center",
    gridTemplateColumns: "1fr",
    transform: "rotateY(15deg)",
    backgroundColor: GreyBackground,
  },
  leftButton: {
    margin: "0px 20px",
    fontSize: "22px",
    cursor: "pointer",
    fontWeight: "bold",
    background: "black",
    color: OrangeYellow,
    padding: "20px 5px",
    transform: "rotateY(28deg)",
    border: `solid 1px ${GreyBorder}`,
  },
  rightContainer: {
    margin: "20px",
    padding: "20px",
    display: "grid",
    gridGap: "10px",
    overflow: "visible",
    alignItems: "center",
    justifyContent: "center",
    gridTemplateColumns: "1fr",
    transform: "rotateY(-15deg)",
    backgroundColor: GreyBackground,
  },
  rightButton: {
    margin: "0px 20px",
    fontSize: "22px",
    cursor: "pointer",
    fontWeight: "bold",
    background: "black",
    color: OrangeYellow,
    padding: "20px 5px",
    transform: "rotateY(-28deg)",
    border: `solid 1px ${GreyBorder}`,
  },
  centerMenuContainer: {
    display: "grid",
    gridGap: "15px",
    margin: "20px 0px",
    gridTemplateColumns: "1fr 1fr 1fr",
  },
  courseContainer: {
    display: "flex",
    flexDirection: "row",
  },
  courseImage: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
  },
  footerContainer: {
    left: "20px",
    bottom: "0px",
    display: "flex",
    position: "absolute",
  },
  footerButton: {
    fontSize: "18px",
    cursor: "pointer",
    fontWeight: "bold",
    borderRadius: "5px",
    background: "black",
    color: OrangeYellow,
    padding: "12px 35px",
    border: `solid 5px ${OrangeYellow}`,
  }
}

export const MainMenu = () => {
  return (
    <div xr-layer="true" style={styles.mainMenuContainer}>
      <div xr-layer="true" style={styles.menuSection}>
        <div xr-layer="true" style={styles.logoContainer}>
          <img xr-layer="true" style={styles.logoContainerImg} src={"/projects/puttclub/assets/puttclub_logo.png"} alt="logo" />
        </div>
        <div xr-layer="true" style={styles.menuContainer}>
          <div xr-layer="true" style={styles.leftContainer}>
            <button xr-layer="true" style={styles.leftButton}>Single Player</button>
            <button xr-layer="true" style={styles.leftButton}>Multi Player</button>
            <button xr-layer="true" style={styles.leftButton}>Quick Match</button>
            <button xr-layer="true" style={styles.leftButton}>Private Game</button>
          </div>
          <div xr-layer="true" style={styles.centerMenuContainer}>
            <div xr-layer="true" style={styles.courseContainer}>
              <div xr-layer="true" style={styles.courseImage}>
                <img xr-layer="true" src={"/projects/puttclub/assets/course1.svg"} alt="course1" />
              </div>
            </div>
            <div xr-layer="true" style={styles.courseContainer}>
              <div xr-layer="true" style={styles.courseImage}>
                <img xr-layer="true" src={"/projects/puttclub/assets/course2.svg"} alt="course2" />
              </div>
            </div>
            <div xr-layer="true" style={styles.courseContainer}>
              <div xr-layer="true" style={styles.courseImage}>
                <img xr-layer="true" src={"/projects/puttclub/assets/course3.svg"} alt="course3" />
              </div>
            </div>
          </div>
          <div xr-layer="true" style={styles.rightContainer}>
            <button xr-layer="true" style={styles.rightButton}>Play Round</button>
            <button xr-layer="true" style={styles.rightButton}>Front 9</button>
            <button xr-layer="true" style={styles.rightButton}>Back 9</button>
            <button xr-layer="true" style={styles.rightButton}>Practice</button>
          </div>
        </div>
      </div>
      <div xr-layer="true" style={styles.footerContainer}>
        <button xr-layer="true" style={styles.footerButton}>Invite Friends</button>
      </div>
    </div>
  )
}

export const MainMenuSystem = async (world: World) => {
  const ui = createXRUI(MainMenu, GolfState)

  return () => {
    const uiComponent = getComponent(ui.entity, XRUIComponent)
    if (!uiComponent) return

    const layer = uiComponent.layer

    layer.position.set(-0.85, 0.5, -1)
    layer.quaternion.set(0, 0, 0, 1)
    layer.scale.setScalar(1)
    layer.matrix.compose(layer.position, layer.quaternion, layer.scale).premultiply(Engine.camera.matrixWorld)
    layer.matrix.decompose(layer.position, layer.quaternion, layer.scale)
  }
}