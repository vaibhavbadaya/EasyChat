"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const initialData = [
  { name: "Completeness", score: 92 },
  { name: "Accuracy", score: 88 },
  { name: "Consistency", score: 95 },
  { name: "Timeliness", score: 85 },
  { name: "Validity", score: 90 },
]

export default function DataQualityChart() {
  const [data, setData] = useState(initialData)

  // Simulate data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(
        data.map((item) => ({
          ...item,
          score: Math.max(
            70,
            Math.min(100, item.score + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3)),
          ),
        })),
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [data])

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => [`${value}%`, "Score"]} labelFormatter={(name) => `Metric: ${name}`} />
          <Bar dataKey="score" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
