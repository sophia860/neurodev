import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { DayTask } from '../services/gemini';
import { motion } from 'motion/react';

interface DayMapProps {
  tasks: DayTask[];
}

export default function DayMap({ tasks }: DayMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .html('') // Clear previous
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Time to angle conversion (24 hours = 2*PI)
    const timeToAngle = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      const totalMinutes = h * 60 + m;
      return (totalMinutes / (24 * 60)) * 2 * Math.PI - Math.PI / 2;
    };

    const arc = d3.arc<DayTask>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.9)
      .startAngle(d => timeToAngle(d.start))
      .endAngle(d => timeToAngle(d.end))
      .padAngle(0.02)
      .cornerRadius(8);

    const colors: Record<string, string> = {
      focus: '#3D2B3D', // Deep Plum
      admin: '#D4A847', // Amber
      rest: '#DDE8DF',  // Sage
      meeting: '#C17A5A', // Terracotta
      social: '#F2E0DC'   // Blush
    };

    // Draw arcs
    svg.selectAll('path')
      .data(tasks)
      .enter()
      .append('path')
      .attr('d', arc as any)
      .attr('fill', d => colors[d.type] || '#EDE6DC')
      .attr('stroke', '#FAF6F0')
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .style('opacity', 1);

    // Add labels
    svg.selectAll('text')
      .data(tasks)
      .enter()
      .append('text')
      .attr('transform', d => {
        const centroid = arc.centroid(d as any);
        return `translate(${centroid[0] * 1.3},${centroid[1] * 1.3})`;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-family', 'Space Mono')
      .attr('fill', '#3D2B3D')
      .attr('class', 'uppercase tracking-tighter')
      .text(d => d.label)
      .style('opacity', 0)
      .transition()
      .delay(500)
      .duration(500)
      .style('opacity', 1);

    // Center text
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-family', 'Playfair Display')
      .attr('font-style', 'italic')
      .attr('font-size', '24px')
      .attr('fill', '#3D2B3D')
      .text('today');

  }, [tasks]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full aspect-square max-w-[400px] mx-auto relative"
    >
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Legend */}
      <div className="absolute bottom-[-20px] left-0 right-0 flex justify-center gap-4 flex-wrap">
        {['focus', 'admin', 'rest', 'meeting', 'social'].map(type => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: {
              focus: '#3D2B3D', admin: '#D4A847', rest: '#DDE8DF', meeting: '#C17A5A', social: '#F2E0DC'
            }[type] }} />
            <span className="text-[8px] font-mono uppercase tracking-widest text-soft-grey">{type}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
