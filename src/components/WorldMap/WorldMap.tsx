import React, { useState, useEffect } from 'react'
import { geoOrthographic, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { Feature, FeatureCollection, Geometry } from 'geojson'
import './WorldMap.scss'
import PlayCircleFilledWhiteIcon from '@material-ui/icons/PlayCircleFilledWhite'
import { Button } from '@material-ui/core'
import AnimationFrame from '../../hooks/AnimationFrame'

const uuid = require('react-uuid')

const height: number = 800
const width: number = 800

const initRotation: number = 100

const WorldMap = () => {
  const [geographies, setGeographies] = useState<[] | Array<Feature<Geometry | null>>>([])
  const [rotation, setRotation] = useState<number>(initRotation)
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

  geographies.forEach(d => {
    if (d != null && d.properties != null)
      console.log(d.properties.name)
  })

  // geoEqualEarth
  // geoOrthographic
  const projection = geoOrthographic().scale(height / 2).translate([width / 2, height / 2]).rotate([rotation, 0])

  AnimationFrame(() => {
    if (isRotate) {
      let newRotation = rotation
      if (rotation >= 360) {
        newRotation = rotation - 360
      }
      setRotation(newRotation + 0.2)
      // console.log(`rotation: ${  rotation}`)
    }
  })

  function returnProjectionValueWhenValid(point: [number, number], index: number) {
    const retVal: [number, number] | null = projection(point)
    if (retVal?.length) {
      return retVal[index]
    }
    return 0
  }

  return (
    <>
      <Button
        size="medium"
        color="primary"
        startIcon={<PlayCircleFilledWhiteIcon />}
        onClick={() => {
          setIsRotate(true)
        }}
      />
      <svg width={width} height={height}>
        <g>
          <circle fill="#f2f2f2" cx={width / 2} cy={height / 2} r={height / 2} />
        </g>
        <g>
          {(geographies as []).map((d, i) => (
            <g>
              <path
                className="country"
                key={`path-${uuid()}`}
                d={geoPath().projection(projection)(d) as string}
                fill={`rgba(38,50,56,${(1 / (geographies ? geographies.length : 0)) * i})`}
                stroke="aliceblue"
                strokeWidth={0.5}
                onMouseEnter={() => setIsRotate(false)}
              />
              <text
                className="country-name"
                key={`path-${uuid()}`}
                x={geoPath().projection(projection).centroid(d)[0]}
                y={geoPath().projection(projection).centroid(d)[1]}
              >
                {geographies[i].properties!.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </>
  )
}

export default WorldMap