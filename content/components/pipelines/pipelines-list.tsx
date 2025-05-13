"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Pause, Settings, Clock, BarChart, RefreshCw, Zap } from "lucide-react"

type PipelineType = "batch" | "streaming" | "scheduled"

type Pipeline = {
  id: string
  name: string
  type: PipelineType
  status: "active" | "paused" | "error"
  schedule: string
  lastRun: string
  nextRun?: string
  avgDuration: string
}

const allPipelines: Pipeline[] = [
  {
    id: "pipe-1",
    name: "Customer Data Integration",
    type: "batch",
    status: "active",
    schedule: "Every 6 hours",
    lastRun: "2023-05-13T08:00:00",
    nextRun: "2023-05-13T14:00:00",
    avgDuration: "45m 20s",
  },
  {
    id: "pipe-2",
    name: "Sales Analytics ETL",
    type: "batch",
    status: "active",
    schedule: "Daily at midnight",
    lastRun: "2023-05-13T00:00:00",
    nextRun: "2023-05-14T00:00:00",
    avgDuration: "1h 15m",
  },
  {
    id: "pipe-3",
    name: "User Activity Stream",
    type: "streaming",
    status: "active",
    schedule: "Real-time",
    lastRun: "Running",
    avgDuration: "Continuous",
  },
  {
    id: "pipe-4",
    name: "Product Inventory Sync",
    type: "batch",
    status: "error",
    schedule: "Every 3 hours",
    lastRun: "2023-05-13T06:00:00",
    nextRun: "2023-05-13T12:00:00",
    avgDuration: "25m 10s",
  },
  {
    id: "pipe-5",
    name: "Marketing Campaign Analytics",
    type: "batch",
    status: "paused",
    schedule: "Weekly on Monday",
    lastRun: "2023-05-08T08:00:00",
    nextRun: "2023-05-15T08:00:00",
    avgDuration: "2h 30m",
  },
  {
    id: "pipe-6",
    name: "Website Events Stream",
    type: "streaming",
    status: "active",
    schedule: "Real-time",
    lastRun: "Running",
    avgDuration: "Continuous",
  },
  {
    id: "pipe-7",
    name: "Financial Data Aggregation",
    type: "scheduled",
    status: "active",
    schedule: "Daily at 4 AM",
    lastRun: "2023-05-13T04:00:00",
    nextRun: "2023-05-14T04:00:00",
    avgDuration: "1h 45m",
  },
  {
    id: "pipe-8",
    name: "Customer Churn Prediction",
    type: "scheduled",
    status: "active",
    schedule: "Weekly on Sunday",
    lastRun: "2023-05-07T12:00:00",
    nextRun: "2023-05-14T12:00:00",
    avgDuration: "3h 20m",
  },
]

interface PipelinesListProps {
  type?: PipelineType
}

export default function PipelinesList({ type }: PipelinesListProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>(allPipelines)

  const filteredPipelines = type ? pipelines.filter((pipeline) => pipeline.type === type) : pipelines

  const togglePipelineStatus = (id: string) => {
    setPipelines(
      pipelines.map((pipeline) =>
        pipeline.id === id
          ? {
              ...pipeline,
              status: pipeline.status === "active" ? "paused" : "active",
            }
          : pipeline,
      ),
    )
  }

  const getTypeIcon = (type: PipelineType) => {
    switch (type) {
      case "batch":
        return <BarChart className="h-4 w-4" />
      case "streaming":
        return <Zap className="h-4 w-4" />
      case "scheduled":
        return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    if (dateString === "Running") return dateString

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pipeline Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Schedule</TableHead>
          <TableHead>Last Run</TableHead>
          <TableHead>Next Run</TableHead>
          <TableHead>Avg. Duration</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredPipelines.map((pipeline) => (
          <TableRow key={pipeline.id}>
            <TableCell className="font-medium">
              <Link href={`/pipelines/${pipeline.id}`} className="hover:text-blue-600">
                {pipeline.name}
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getTypeIcon(pipeline.type)}
                <span className="capitalize">{pipeline.type}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  pipeline.status === "active" ? "success" : pipeline.status === "paused" ? "outline" : "destructive"
                }
              >
                {pipeline.status}
              </Badge>
            </TableCell>
            <TableCell>{pipeline.schedule}</TableCell>
            <TableCell>
              {pipeline.type === "streaming" && pipeline.status === "active" ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                  <span>Running</span>
                </div>
              ) : (
                formatDate(pipeline.lastRun)
              )}
            </TableCell>
            <TableCell>
              {pipeline.type === "streaming" ? "Continuous" : pipeline.nextRun ? formatDate(pipeline.nextRun) : "N/A"}
            </TableCell>
            <TableCell>{pipeline.avgDuration}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {pipeline.type !== "streaming" && (
                  <Button variant="outline" size="icon" onClick={() => {}}>
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={() => togglePipelineStatus(pipeline.id)}>
                  {pipeline.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
