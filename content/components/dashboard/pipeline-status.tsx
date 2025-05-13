"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const COLORS = ["#10b981", "#f97316", "#ef4444"]

const initialData = [
  { name: "Successful", value: 85 },
  { name: "Warning", value: 10 },
  { name: "Failed", value: 5 },
]

export default function PipelineStatus() {
  const [data, setData] = useState(initialData)

  // Simulate data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const successful = 80 + Math.floor(Math.random() * 15)
      const warning = Math.floor(Math.random() * 15)
      const failed = 100 - successful - warning

      setData([
        { name: "Successful", value: successful },
        { name: "Warning", value: warning },
        { name: "Failed", value: failed },
      ])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} labelFormatter={(name) => `Status: ${name}`} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center mt-4 space-x-6">
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center">
            <div className="w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="text-sm">
              {entry.name}: {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
