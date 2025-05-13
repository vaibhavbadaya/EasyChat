import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Clock, Database, FileJson, GitFork, Plus, RefreshCw, Workflow } from "lucide-react"
import PipelinesList from "@/components/pipelines/pipelines-list"
import PipelineGraph from "@/components/pipelines/pipeline-graph"

export default function PipelinesPage() {
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Data Pipelines</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <GitFork className="h-4 w-4" />
            <span>Deploy Changes</span>
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>New Pipeline</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Pipelines</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">6 batch, 2 streaming</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Execution Frequency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-muted-foreground">Executions in the last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Data Processed</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 TB</div>
            <p className="text-xs text-muted-foreground">In the last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Pipelines</TabsTrigger>
          <TabsTrigger value="batch">Batch</TabsTrigger>
          <TabsTrigger value="streaming">Streaming</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <PipelinesList />
        </TabsContent>
        <TabsContent value="batch" className="mt-6">
          <PipelinesList type="batch" />
        </TabsContent>
        <TabsContent value="streaming" className="mt-6">
          <PipelinesList type="streaming" />
        </TabsContent>
        <TabsContent value="scheduled" className="mt-6">
          <PipelinesList type="scheduled" />
        </TabsContent>
      </Tabs>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Featured Pipeline</h2>
        <Card>
          <CardHeader>
            <CardTitle>Customer Data Integration Pipeline</CardTitle>
            <CardDescription>
              Extracts customer data from multiple sources, transforms it, and loads it into the data warehouse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineGraph />
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Data Sources</h3>
                <div className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4 text-blue-500" />
                  <span>PostgreSQL Production</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileJson className="h-4 w-4 text-blue-500" />
                  <span>Salesforce API</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileJson className="h-4 w-4 text-blue-500" />
                  <span>S3 Customer Files</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Transformations</h3>
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 text-green-500" />
                  <span>Data Cleaning</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 text-green-500" />
                  <span>Schema Normalization</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 text-green-500" />
                  <span>Data Enrichment</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Destination</h3>
                <div className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4 text-purple-500" />
                  <span>Snowflake Data Warehouse</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4 text-purple-500" />
                  <span>Customer 360 View</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="outline" className="gap-2">
                <span>View Pipeline Details</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
