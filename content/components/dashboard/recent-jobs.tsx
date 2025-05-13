"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, RefreshCw, Eye } from "lucide-react"

type JobStatus = "completed" | "running" | "failed" | "pending"

type Job = {
  id: string
  pipelineName: string
  status: JobStatus
  startTime: string
  duration: string
  recordsProcessed: number
}

const initialJobs: Job[] = [
  {
    id: "job-1",
    pipelineName: "Customer Data ETL",
    status: "completed",
    startTime: "2023-05-13T10:00:00",
    duration: "12m 30s",
    recordsProcessed: 125000,
  },
  {
    id: "job-2",
    pipelineName: "Sales Analytics",
    status: "running",
    startTime: "2023-05-13T10:15:00",
    duration: "5m 45s",
    recordsProcessed: 45000,
  },
  {
    id: "job-3",
    pipelineName: "Product Inventory Sync",
    status: "failed",
    startTime: "2023-05-13T09:30:00",
    duration: "2m 15s",
    recordsProcessed: 5200,
  },
  {
    id: "job-4",
    pipelineName: "User Activity Stream",
    status: "completed",
    startTime: "2023-05-13T09:00:00",
    duration: "8m 10s",
    recordsProcessed: 78000,
  },
  {
    id: "job-5",
    pipelineName: "Marketing Campaign Data",
    status: "pending",
    startTime: "2023-05-13T10:30:00",
    duration: "0s",
    recordsProcessed: 0,
  },
]

export default function RecentJobs() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)

  // Simulate job updates
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          if (job.status === "running") {
            // Increment duration for running jobs
            const [minutes, seconds] = job.duration.split("m ").map((part) => Number.parseInt(part))
            const newSeconds = seconds + 15
            const newMinutes = minutes + Math.floor(newSeconds / 60)
            const remainingSeconds = newSeconds % 60

            return {
              ...job,
              duration: `${newMinutes}m ${remainingSeconds}s`,
              recordsProcessed: job.recordsProcessed + Math.floor(Math.random() * 5000),
            }
          } else if (job.status === "pending" && Math.random() > 0.7) {
            // Start pending jobs occasionally
            return {
              ...job,
              status: "running",
              startTime: new Date().toISOString(),
              duration: "0m 15s",
              recordsProcessed: Math.floor(Math.random() * 1000),
            }
          } else if (job.status === "running" && Math.random() > 0.8) {
            // Complete running jobs occasionally
            return {
              ...job,
              status: Math.random() > 0.2 ? "completed" : "failed",
            }
          }
          return job
        }),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>
      case "running":
        return <Badge variant="default">Running</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pipeline</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="text-right">Records Processed</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="font-medium">{job.pipelineName}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getStatusIcon(job.status)}
                {getStatusBadge(job.status)}
              </div>
            </TableCell>
            <TableCell>{formatDate(job.startTime)}</TableCell>
            <TableCell>{job.duration}</TableCell>
            <TableCell className="text-right">{formatNumber(job.recordsProcessed)}</TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Logs
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
