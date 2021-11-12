import React from 'react'
import { useState } from '@hookstate/core'
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
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    justifyContent: "center",
  },
  leftContainerImg: {
    width: "100%",
    position: "absolute",
  },
  leftButtonsContainer: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    transform: "rotateY(15deg)",
  },
  leftButton: {
    width: "65%",
    fontSize: "22px",
    cursor: "pointer",
    fontWeight: "bold",
    background: "black",
    color: OrangeYellow,
    padding: "20px 5px",
    marginBottom: "20px",
    transform: "rotateY(28deg)",
    border: `solid 1px ${GreyBorder}`,
  },
  rightContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    justifyContent: "center",
  },
  rightContainerImg: {
    width: "100%",
    position: "absolute",
  },
  rightButtonsContainer: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    transform: "rotateY(-15deg)",
  },
  rightButton: {
    width: "65%",
    fontSize: "22px",
    cursor: "pointer",
    fontWeight: "bold",
    background: "black",
    color: OrangeYellow,
    padding: "20px 5px",
    marginBottom: "20px",
    transform: "rotateY(-28deg)",
    border: `solid 1px ${GreyBorder}`,
  },
  centerMenuContainer: {
    display: "grid",
    gridGap: "15px",
    gridTemplateColumns: "1fr 1fr 1fr",
  },
  courseContainer: {
    display: "flex",
    cursor: "pointer",
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  courseImage: {
    width: "100%",
  },
  courseText: {
    left: "30%",
    bottom: "25px",
    fontSize: "28px",
    fontWeight: "bold",
    textAlign: "center",
    color: OrangeYellow,
    position: "absolute",
  },
  footerContainer: {
    display: "flex",
    marginTop: "50px",
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
} as const

export const MainMenu = () => {
  const courses = [
    {
      name: "Course-1",
      imagePath: "/projects/puttclub/assets/course1.svg",
    },
    {
      name: "Course-2",
      imagePath: "/projects/puttclub/assets/course2.svg",
    },
    {
      name: "Course-3",
      imagePath: "/projects/puttclub/assets/course3.svg",
    }
  ]

  return (
    <div xr-layer="true" style={styles.mainMenuContainer}>
      <div xr-layer="true" style={styles.menuSection}>
        <div xr-layer="true" style={styles.logoContainer}>
          <img xr-layer="true" style={styles.logoContainerImg} src={"/projects/puttclub/assets/puttclub_logo.png"} alt="logo" />
        </div>
        <div xr-layer="true" style={styles.menuContainer}>
          <div xr-layer="true" style={styles.leftContainer}>
            <img xr-layer="true" style={styles.leftContainerImg} src={'/projects/puttclub/assets/left_rectangle.svg'} alt="left" />
            <div style={styles.leftButtonsContainer}>
              <button xr-layer="true" style={styles.leftButton}>Single Player</button>
              <button xr-layer="true" style={styles.leftButton}>Multiplayer</button>
              <button xr-layer="true" style={styles.leftButton}>Quick Match</button>
              <button xr-layer="true" style={styles.leftButton}>Private Game</button>
            </div>
          </div>
          <div xr-layer="true" style={styles.centerMenuContainer}>
            {courses.map((course, cIndex) => {
              return (
                <div key={cIndex} xr-layer="true" style={styles.courseContainer}>
                  <div xr-layer="true" style={styles.courseImage}>
                    <img xr-layer="true" src={course.imagePath} alt="course" />
                    <div xr-layer="true" style={styles.courseText}>{course.name}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div xr-layer="true" style={styles.rightContainer}>
            <img xr-layer="true" style={styles.rightContainerImg} src={'/projects/puttclub/assets/right_rectangle.svg'} alt="right" />
            <div style={styles.rightButtonsContainer}>
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
