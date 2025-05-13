import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, FileText, Search, TableIcon, Tag, Users } from "lucide-react"
import DatasetsList from "@/components/data-catalog/datasets-list"
import DataLineage from "@/components/data-catalog/data-lineage"

export default function DataCatalogPage() {
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Data Catalog</h1>
        <Button>Add Dataset</Button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search datasets, tables, or columns..." className="pl-8" />
        </div>
        <Button variant="outline">Advanced Search</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Datasets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tables</CardTitle>
            <TableIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Data Owners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="datasets" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
          <TabsTrigger value="lineage">Data Lineage</TabsTrigger>
          <TabsTrigger value="popular">Popular Datasets</TabsTrigger>
        </TabsList>
        <TabsContent value="datasets" className="mt-6">
          <DatasetsList />
        </TabsContent>
        <TabsContent value="lineage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Lineage</CardTitle>
              <CardDescription>Visualize the flow of data across your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <DataLineage />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="popular" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Popular Datasets</CardTitle>
              <CardDescription>Most frequently accessed datasets in your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Popular Datasets</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  This section will display the most frequently accessed and used datasets in your organization, helping
                  you understand data usage patterns.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
