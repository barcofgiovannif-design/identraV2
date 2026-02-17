import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Power, TrendingUp } from "lucide-react";

export default function CompaniesTable({ companies }) {
  const queryClient = useQueryClient();

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => 
      base44.entities.Company.update(id, { status: status === 'active' ? 'suspended' : 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Companies</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Purchased URLs</TableHead>
              <TableHead>Used URLs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">{company.company_name}</TableCell>
                <TableCell>{company.email}</TableCell>
                <TableCell>{company.purchased_urls}</TableCell>
                <TableCell>{company.used_urls}</TableCell>
                <TableCell>
                  <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                    {company.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStatusMutation.mutate({ id: company.id, status: company.status })}
                    disabled={toggleStatusMutation.isPending}
                  >
                    <Power className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}