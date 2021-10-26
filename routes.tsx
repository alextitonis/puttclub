import React from 'react'
import { Route } from 'react-router-dom'

const $ = React.lazy(() => import('./pages/index'))

export default function (route: string) {
  switch (route) {
    case '/':
      return [<Route key={'/'} path={'/'} component={$} exact />]
  }
}
