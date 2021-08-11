import React, { useState, useEffect } from 'react'
import { geoOrthographic, GeoPath, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { Feature, FeatureCollection, Geometry } from 'geojson'
import './WorldMap.scss'
import PlayCircleFilledWhiteIcon from '@material-ui/icons/PlayCircleFilledWhite'
import { Button } from '@material-ui/core'
import AnimationFrame from '../../hooks/AnimationFrame'

const uuid = require('react-uuid')

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

const height: number = 800
const width: number = 800
const minCountryTitleArea = 250

const initRotation: number = 0

const WorldMap = () => {
  const [geographies, setGeographies] = useState<[] | Array<Feature<Geometry | null>>>([])
  const [eventStartX, setEventStartX] = useState<number>(0)
  const [eventStartY, setEventStartY] = useState<number>(0)
  const [rotationX, setRotationX] = useState<number>(initRotation)
  const [rotationY, setRotationY] = useState<number>(initRotation)
  const [isRotate, setIsRotate] = useState<Boolean>(false)

  useEffect(() => {
    fetch('/data/world-110m.json').then((response) => {
      if (response.status !== 200) {
        // eslint-disable-next-line no-console
        console.log(`Houston we have a problem: ${response.status}`)
        return
      }
      response.json().then((worldData) => {
        const mapFeatures: Array<Feature<Geometry | null>> = ((feature(worldData, worldData.objects.countries) as unknown) as FeatureCollection).features
        setGeographies(mapFeatures)
      })
    })
  }, [])

  // geoEqualEarth
  // geoOrthographic
  const projection = geoOrthographic().scale(height / 2).translate([width / 2, height / 2]).rotate([rotationX, rotationY])

  function returnProjectionValueWhenValid(point: [number, number], index: number) {
    const retVal: [number, number] | null = projection(point)
    if (retVal?.length) {
      return retVal[index]
    }
    return 0
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setEventStartX(e.clientX)
    setEventStartY(e.clientY)
    setIsRotate(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isRotate)
      return
    setRotationX(getNewRotation(rotationX, eventStartX - e.clientX))
    setRotationY(getNewRotation(rotationY, e.clientY - eventStartY))
  }

  function getNewRotation(current: number, delta: number) {
    let newRotation = current - delta / 50
    if (newRotation >= 360)
      return newRotation - 360
    if (newRotation <= 0)
      return newRotation + 360
    return newRotation
  }

  function renderCountryName(path : GeoPath, d : never, name: string) {
    if (path.measure(d) > minCountryTitleArea)
    {
      let coordinates = path.centroid(d)
      let textWidth = context?.measureText(name).width
      return (
        <text
          className="country-name"
          key={`path-${uuid()}`}
          x={`${coordinates[0] - (textWidth ? textWidth / 2 : 0)}`}
          y={`${coordinates[1]}`}
        >
          {name}
        </text>
      )
    }
    else
      return (null)
  }

  let path = geoPath().projection(projection)
  return (
    <>
      <svg
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseUp={() => setIsRotate(false)}
        onMouseMove={handleMouseMove}
      >
        <g>
          <circle fill="#f2f2f2" cx={width / 2} cy={height / 2} r={height / 2} />
        </g>
        <g>
          {(geographies as []).map((d, i) => (
            <g>
              <path
                className="country"
                key={`path-${uuid()}`}
                d={path(d) as string}
                fill={`rgba(38,50,56,${(1 / (geographies ? geographies.length : 0)) * i})`}
                stroke="aliceblue"
                strokeWidth={0.5}
              />
              {renderCountryName(path, d, geographies[i].properties!.name)}
            </g>
          ))}
        </g>
      </svg>
    </>
  )
}

export default WorldMap