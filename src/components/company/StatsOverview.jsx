import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link as LinkIcon, CheckCircle, Package } from "lucide-react";

export default function StatsOverview({ company, totalCards }) {
  const stats = [
    {
      title: "Purchased URLs",
      value: company.purchased_urls,
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Used URLs",
      value: company.used_urls,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Available URLs",
      value: company.purchased_urls - company.used_urls,
      icon: LinkIcon,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-xl">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}