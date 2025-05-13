import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, GitFork, LineChart, Server, Workflow } from "lucide-react"
import DashboardMetrics from "@/components/dashboard/dashboard-metrics"
import DataSourcesTable from "@/components/dashboard/data-sources-table"
import PipelineStatus from "@/components/dashboard/pipeline-status"
import DataQualityChart from "@/components/dashboard/data-quality-chart"
import RecentJobs from "@/components/dashboard/recent-jobs"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Workflow className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">DataFlow Analytics</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-blue-600">
              Dashboard
            </Link>
            <Link href="/pipelines" className="text-sm font-medium">
              Pipelines
            </Link>
            <Link href="/data-catalog" className="text-sm font-medium">
              Data Catalog
            </Link>
            <Link href="/monitoring" className="text-sm font-medium">
              Monitoring
            </Link>
            <Link href="/settings" className="text-sm font-medium">
              Settings
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              Documentation
            </Button>
            <Button size="sm">New Pipeline</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Data Engineering Dashboard</h1>
            <Button variant="outline" className="gap-2">
              <GitFork className="h-4 w-4" />
              <span>Deploy Changes</span>
            </Button>
          </div>

          <DashboardMetrics />

          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
              <TabsTrigger value="data-quality">Data Quality</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">4 databases, 5 APIs, 3 file systems</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/data-sources" className="text-xs text-blue-600">
                      View all data sources
                    </Link>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active Pipelines</CardTitle>
                    <Workflow className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">6 batch, 2 streaming</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/pipelines" className="text-xs text-blue-600">
                      View all pipelines
                    </Link>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Data Warehouse</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1.2 TB</div>
                    <p className="text-xs text-muted-foreground">42 tables, 156 views</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/data-warehouse" className="text-xs text-blue-600">
                      View data warehouse
                    </Link>
                  </CardFooter>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Pipeline Status</CardTitle>
                    <CardDescription>Last 24 hours pipeline execution status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PipelineStatus />
                  </CardContent>
                </Card>
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Data Quality</CardTitle>
                    <CardDescription>Data quality metrics across all pipelines</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataQualityChart />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-1">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Data Sources</CardTitle>
                    <CardDescription>Connected data sources and their status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataSourcesTable />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="pipelines" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Pipeline Jobs</CardTitle>
                  <CardDescription>Status of recently executed data pipeline jobs</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentJobs />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="data-quality" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Quality Metrics</CardTitle>
                  <CardDescription>Detailed data quality metrics by dataset</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <LineChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Data Quality Metrics</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Detailed data quality metrics will be displayed here, showing completeness, accuracy, consistency,
                      and timeliness of your data across all pipelines.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="resources" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Resources</CardTitle>
                  <CardDescription>Compute and storage resource utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Server className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Resource Monitoring</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      System resource utilization metrics will be displayed here, showing CPU, memory, disk usage, and
                      network throughput for your data infrastructure.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold">DataFlow Analytics</span>
          </div>
          <div className="flex gap-4 md:gap-6 text-sm text-gray-600 mt-4 md:mt-0">
            <Link href="/about">About</Link>
            <Link href="/docs">Documentation</Link>
            <Link href="/api">API</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-gray-600">
            © {new Date().getFullYear()} DataFlow Analytics. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
