"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="border-gray-200 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200 py-4">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">{children}</CardContent>
    </Card>
  );
}
