"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database, Globe, FileText, RefreshCw, Settings } from "lucide-react"

type DataSource = {
  id: string
  name: string
  type: "database" | "api" | "file"
  status: "connected" | "error" | "warning"
  lastSync: string
  recordsProcessed: number
}

const dataSources: DataSource[] = [
  {
    id: "ds-1",
    name: "PostgreSQL Production",
    type: "database",
    status: "connected",
    lastSync: "2023-05-13T08:30:00",
    recordsProcessed: 1250000,
  },
  {
    id: "ds-2",
    name: "MySQL Analytics",
    type: "database",
    status: "connected",
    lastSync: "2023-05-13T09:15:00",
    recordsProcessed: 450000,
  },
  {
    id: "ds-3",
    name: "MongoDB User Data",
    type: "database",
    status: "warning",
    lastSync: "2023-05-13T07:45:00",
    recordsProcessed: 320000,
  },
  {
    id: "ds-4",
    name: "Salesforce API",
    type: "api",
    status: "connected",
    lastSync: "2023-05-13T10:00:00",
    recordsProcessed: 85000,
  },
  {
    id: "ds-5",
    name: "Weather API",
    type: "api",
    status: "error",
    lastSync: "2023-05-12T23:30:00",
    recordsProcessed: 0,
  },
  {
    id: "ds-6",
    name: "S3 Log Files",
    type: "file",
    status: "connected",
    lastSync: "2023-05-13T06:00:00",
    recordsProcessed: 250000,
  },
]

export default function DataSourcesTable() {
  const [sources, setSources] = useState<DataSource[]>(dataSources)
  const [refreshing, setRefreshing] = useState<string | null>(null)

  const handleRefresh = (id: string) => {
    setRefreshing(id)

    // Simulate refresh
    setTimeout(() => {
      setSources(
        sources.map((source) =>
          source.id === id
            ? {
                ...source,
                lastSync: new Date().toISOString(),
                status: Math.random() > 0.2 ? "connected" : Math.random() > 0.5 ? "warning" : "error",
              }
            : source,
        ),
      )
      setRefreshing(null)
    }, 2000)
  }

  const getTypeIcon = (type: DataSource["type"]) => {
    switch (type) {
      case "database":
        return <Database className="h-4 w-4" />
      case "api":
        return <Globe className="h-4 w-4" />
      case "file":
        return <FileText className="h-4 w-4" />
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Sync</TableHead>
          <TableHead className="text-right">Records Processed</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((source) => (
          <TableRow key={source.id}>
            <TableCell className="font-medium">{source.name}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getTypeIcon(source.type)}
                <span className="capitalize">{source.type}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  source.status === "connected" ? "success" : source.status === "warning" ? "warning" : "destructive"
                }
              >
                {source.status}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(source.lastSync)}</TableCell>
            <TableCell className="text-right">{formatNumber(source.recordsProcessed)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRefresh(source.id)}
                  disabled={refreshing === source.id}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing === source.id ? "animate-spin" : ""}`} />
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
