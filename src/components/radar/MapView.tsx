'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

interface MapViewProps {
  data: Array<{ country_code: string; count: number }>
}

const numericToAlpha2: Record<number, string> = {
  392: 'JP', 840: 'US', 410: 'KR', 158: 'TW', 764: 'TH', 704: 'VN',
  608: 'PH', 360: 'ID', 458: 'MY', 702: 'SG', 356: 'IN', 156: 'CN',
  826: 'GB', 276: 'DE', 250: 'FR', 76: 'BR', 566: 'NG', 792: 'TR',
  784: 'AE', 36: 'AU', 124: 'CA', 643: 'RU', 380: 'IT', 724: 'ES',
  484: 'MX', 710: 'ZA', 682: 'SA', 818: 'EG', 404: 'KE',
}

export function MapView({ data }: MapViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const container = containerRef.current
    const svg = d3.select(svgRef.current)

    const countMap = new Map<string, number>()
    for (const d of data) {
      countMap.set(d.country_code, d.count)
    }
    const maxCount = d3.max(data, (d) => d.count) || 1

    const colorScale = d3.scaleSequential()
      .domain([0, maxCount])
      .interpolator(d3.interpolateRgb('#1E1D1A', '#C84B2F'))

    function render() {
      if (!svgRef.current || !containerRef.current) return

      const width = container.clientWidth
      const height = container.clientHeight

      svg.attr('width', width).attr('height', height)
      svg.selectAll('*').remove()

      svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#161512')

      const projection = d3.geoNaturalEarth1()
        .fitSize([width, height], { type: 'Sphere' } as any)

      const path = d3.geoPath().projection(projection)

      const g = svg.append('g')

      d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((world: any) => {
        const countries = topojson.feature(world, world.objects.countries) as any

        g.selectAll('path')
          .data(countries.features)
          .enter()
          .append('path')
          .attr('d', path as any)
          .attr('fill', (d: any) => {
            const alpha2 = numericToAlpha2[+d.id]
            if (!alpha2) return '#1E1D1A'
            const count = countMap.get(alpha2) || 0
            return colorScale(count)
          })
          .attr('stroke', 'rgba(255,255,255,0.06)')
          .attr('stroke-width', 0.3)
          .on('mouseenter', function () {
            d3.select(this)
              .attr('stroke', 'rgba(200,75,47,0.5)')
              .attr('stroke-width', 1)
          })
          .on('mouseleave', function () {
            d3.select(this)
              .attr('stroke', 'rgba(255,255,255,0.06)')
              .attr('stroke-width', 0.3)
          })
      })
    }

    render()

    const resizeObserver = new ResizeObserver(() => {
      render()
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [data])

  return (
    <div className="r-panel">
      <div className="r-panel-header">
        <span className="r-panel-title">拡散マップ</span>
        <span className="r-panel-badge">日本語CT特化</span>
      </div>
      <div className="r-map-container" ref={containerRef}>
        <svg ref={svgRef} />
      </div>
    </div>
  )
}
