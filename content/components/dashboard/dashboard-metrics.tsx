"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight, ArrowDownRight, Clock, Database, FileCheck2, AlertTriangle } from "lucide-react"

export default function DashboardMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processed Records</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2.4M</div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-muted-foreground">Today</span>
            <div className="flex items-center text-green-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>12.5%</span>
            </div>
          </div>
          <Progress className="mt-3" value={65} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pipeline Success Rate</CardTitle>
          <FileCheck2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">98.2%</div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-muted-foreground">Last 24h</span>
            <div className="flex items-center text-red-500">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              <span>0.8%</span>
            </div>
          </div>
          <Progress className="mt-3" value={98} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Data Freshness</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">15 min</div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-muted-foreground">Average</span>
            <div className="flex items-center text-green-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>5.2%</span>
            </div>
          </div>
          <Progress className="mt-3" value={85} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Data Quality Issues</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">24</div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-muted-foreground">Open issues</span>
            <div className="flex items-center text-red-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>3 new</span>
            </div>
          </div>
          <Progress className="mt-3" value={24} />
        </CardContent>
      </Card>
    </div>
  )
}
