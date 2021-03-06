import React from 'react'
import { useState } from '@hookstate/core'
import { GolfState } from './GolfSystem'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { createXRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { XRUIComponent } from '@xrengine/engine/src/xrui/components/XRUIComponent'
import { defineQuery, getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'

const OrangeYellow = '#ffaa22'
const GreyBorder = '#5a5a5a'
const GreyBackground = '#3d3838'

const styles = {
  mainMenuContainer: {
    width: '100%',
    zIndex: 10,
    height: '100%',
    display: 'flex',
    position: 'fixed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent'
  },
  menuSection: {
    display: 'flex',
    margin: '20px 0px',
    flexDirection: 'column'
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoContainerImg: {
    width: '400px',
    height: 'auto'
  },
  menuContainer: {
    display: 'grid',
    gridGap: '20px',
    gridTemplateColumns: '1fr 1fr 1fr'
  },
  leftContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'center'
  },
  leftContainerImg: {
    width: '100%',
    position: 'absolute'
  },
  leftButtonsContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    transform: 'rotateY(15deg)'
  },
  leftButton: {
    width: '65%',
    fontSize: '22px',
    cursor: 'pointer',
    fontWeight: 'bold',
    background: 'black',
    color: OrangeYellow,
    padding: '20px 5px',
    marginBottom: '20px',
    transform: 'rotateY(28deg)',
    border: `solid 1px ${GreyBorder}`
  },
  rightContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'center'
  },
  rightContainerImg: {
    width: '100%',
    position: 'absolute'
  },
  rightButtonsContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    transform: 'rotateY(-15deg)'
  },
  rightButton: {
    width: '65%',
    fontSize: '22px',
    cursor: 'pointer',
    fontWeight: 'bold',
    background: 'black',
    color: OrangeYellow,
    padding: '20px 5px',
    marginBottom: '20px',
    transform: 'rotateY(-28deg)',
    border: `solid 1px ${GreyBorder}`
  },
  centerMenuContainer: {
    display: 'grid',
    gridGap: '15px',
    gridTemplateColumns: '1fr 1fr 1fr'
  },
  courseContainer: {
    display: 'flex',
    cursor: 'pointer',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  courseImage: {
    width: '100%'
  },
  courseText: {
    left: '30%',
    bottom: '25px',
    fontSize: '28px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: OrangeYellow,
    position: 'absolute'
  },
  footerContainer: {
    display: 'flex',
    marginTop: '50px'
  },
  footerButton: {
    fontSize: '18px',
    cursor: 'pointer',
    fontWeight: 'bold',
    borderRadius: '5px',
    background: 'black',
    color: OrangeYellow,
    padding: '12px 35px',
    border: `solid 5px ${OrangeYellow}`
  }
} as const

export const MainMenu = () => {
  const courses = [
    {
      name: 'Course-1',
      imagePath: '/projects/puttclub/assets/course1.svg'
    },
    {
      name: 'Course-2',
      imagePath: '/projects/puttclub/assets/course2.svg'
    },
    {
      name: 'Course-3',
      imagePath: '/projects/puttclub/assets/course3.svg'
    }
  ]

  return (
    <div xr-layer="" style={styles.mainMenuContainer}>
      <style type="text/css">{`

        button:hover {
          background-color: ${GreyBackground} !important
        }

        .side-button {
          width: 100px;
          fontSize: 30px;
          cursor: pointer;
          fontWeight: bold;
          background: black;
          color: ${OrangeYellow};
          padding: 20px 5px;
          marginBottom: 20px;
          border: solid 4px ${OrangeYellow};
          border-radius: 20px;
        }

        .left {
          transform: rotateY(28deg);
        }

        .right {
          transform: rotateY(-28deg);
        }

      `}</style>
      <div style={styles.menuSection}>
        <div style={styles.logoContainer}>
          <img
            xr-layer=""
            style={styles.logoContainerImg}
            src={'/projects/puttclub/assets/puttclub_logo.png'}
            alt="logo"
          />
        </div>
        <div style={styles.menuContainer}>
          <div style={styles.leftContainer}>
            <div style={styles.leftButtonsContainer}>
              <button xr-layer="" className='left side-button'>
                Single Player
              </button>
              <button xr-layer="" className='left side-button'>
                Multiplayer
              </button>
              <button xr-layer="" className='left side-button'>
                Quick Match
              </button>
              <button xr-layer="" className='left side-button'>
                Private Game
              </button>
            </div>
          </div>
          <div style={styles.centerMenuContainer}>
            {courses.map((course, cIndex) => {
              return (
                <div key={cIndex} xr-layer="" style={styles.courseContainer}>
                  <div xr-layer="" style={styles.courseImage}>
                    <img xr-layer="" src={course.imagePath} alt="course" />
                    <div xr-layer="" className="courseName" style={styles.courseText}>
                      {course.name}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={styles.rightContainer}>
            <div style={styles.rightButtonsContainer}>
              <button xr-layer="" className="right side-button">
                Play Round
              </button>
              <button xr-layer="" className="right side-button">
                Front 9
              </button>
              <button xr-layer="" className="right side-button">
                Back 9
              </button>
              <button xr-layer="" className="right side-button">
                Practice
              </button>
            </div>
          </div>
        </div>
        <div style={styles.footerContainer}>
          <button xr-layer="" style={styles.footerButton}>
            Invite Friends
          </button>
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

    const mainMenuEntity = world.namedEntities.get('MainMenu')
    if (!mainMenuEntity) return

    const mainMenuTransform = getComponent(mainMenuEntity, TransformComponent)
    
    const layer = uiComponent.layer

    layer.position.copy(mainMenuTransform.position)
    layer.quaternion.copy(mainMenuTransform.rotation)
    layer.scale.setScalar(3)
  }
}
