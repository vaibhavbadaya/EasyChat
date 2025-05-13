"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database, FileText, Eye, BarChart, User } from "lucide-react"

type Dataset = {
  id: string
  name: string
  description: string
  type: "table" | "view" | "file"
  source: string
  owner: string
  tags: string[]
  updatedAt: string
  rowCount: number
}

const datasets: Dataset[] = [
  {
    id: "ds-1",
    name: "customer_data",
    description: "Consolidated customer information from multiple sources",
    type: "table",
    source: "Snowflake",
    owner: "Data Team",
    tags: ["customer", "core", "pii"],
    updatedAt: "2023-05-13T08:30:00",
    rowCount: 1250000,
  },
  {
    id: "ds-2",
    name: "sales_transactions",
    description: "Daily sales transaction data",
    type: "table",
    source: "Snowflake",
    owner: "Sales Analytics",
    tags: ["sales", "financial", "core"],
    updatedAt: "2023-05-13T09:15:00",
    rowCount: 15000000,
  },
  {
    id: "ds-3",
    name: "product_inventory",
    description: "Current product inventory levels",
    type: "table",
    source: "PostgreSQL",
    owner: "Product Team",
    tags: ["product", "inventory"],
    updatedAt: "2023-05-13T07:45:00",
    rowCount: 50000,
  },
  {
    id: "ds-4",
    name: "customer_360_view",
    description: "Comprehensive view of customer data and interactions",
    type: "view",
    source: "Snowflake",
    owner: "Marketing",
    tags: ["customer", "marketing", "derived"],
    updatedAt: "2023-05-13T10:00:00",
    rowCount: 1250000,
  },
  {
    id: "ds-5",
    name: "marketing_campaign_performance",
    description: "Performance metrics for marketing campaigns",
    type: "view",
    source: "Snowflake",
    owner: "Marketing",
    tags: ["marketing", "metrics", "derived"],
    updatedAt: "2023-05-12T23:30:00",
    rowCount: 5000,
  },
  {
    id: "ds-6",
    name: "web_logs",
    description: "Raw web server logs from the company website",
    type: "file",
    source: "S3",
    owner: "Web Team",
    tags: ["logs", "raw", "web"],
    updatedAt: "2023-05-13T06:00:00",
    rowCount: 25000000,
  },
]

export default function DatasetsList() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredDatasets = datasets.filter(
    (dataset) =>
      dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dataset.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getTypeIcon = (type: Dataset["type"]) => {
    switch (type) {
      case "table":
        return <Database className="h-4 w-4" />
      case "view":
        return <BarChart className="h-4 w-4" />
      case "file":
        return <FileText className="h-4 w-4" />
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
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Row Count</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredDatasets.map((dataset) => (
          <TableRow key={dataset.id}>
            <TableCell className="font-medium">
              <Link href={`/data-catalog/${dataset.id}`} className="hover:text-blue-600">
                {dataset.name}
              </Link>
            </TableCell>
            <TableCell className="max-w-xs truncate">{dataset.description}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getTypeIcon(dataset.type)}
                <span className="capitalize">{dataset.type}</span>
              </div>
            </TableCell>
            <TableCell>{dataset.source}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{dataset.owner}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {dataset.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>{formatDate(dataset.updatedAt)}</TableCell>
            <TableCell className="text-right">{formatNumber(dataset.rowCount)}</TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
