"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LocalTime } from "@/components/ui/local-time";
import { Credit, CreditPool } from "@/types/credit";

interface MyCreditTabsProps {
  credits: Credit[];
  creditPools: CreditPool[];
  translations: {
    recordsTab: string;
    poolsTab: string;
    noCredits: string;
    table: {
      trans_no: string;
      trans_type: string;
      credits: string;
      updated_at: string;
    };
    poolsTable: {
      order_no: string;
      expired_at: string;
      balance: string;
      earned: string;
      created_at: string;
    };
    bonus: string;
  };
  transTypeMap: Record<string, string>;
}

export function MyCreditsTabs({
  credits,
  creditPools,
  translations,
  transTypeMap,
}: MyCreditTabsProps) {
  return (
    <Tabs defaultValue="records" className="w-full">
      <TabsList>
        <TabsTrigger value="records">{translations.recordsTab}</TabsTrigger>
        <TabsTrigger value="pools">{translations.poolsTab}</TabsTrigger>
      </TabsList>

      <TabsContent value="records" className="mt-4">
        {credits.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations.table.trans_no}</TableHead>
                <TableHead>{translations.table.trans_type}</TableHead>
                <TableHead>{translations.table.credits}</TableHead>
                <TableHead>{translations.table.updated_at}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map((credit) => (
                <TableRow key={credit.trans_no}>
                  <TableCell className="font-mono text-xs">
                    {credit.trans_no}
                  </TableCell>
                  <TableCell>
                    {transTypeMap[credit.trans_type] || credit.trans_type}
                  </TableCell>
                  <TableCell
                    className={
                      credit.credits > 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    {credit.credits > 0 ? `+${credit.credits}` : credit.credits}
                  </TableCell>
                  <TableCell>
                    <LocalTime date={credit.created_at} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {translations.noCredits}
          </div>
        )}
      </TabsContent>

      <TabsContent value="pools" className="mt-4">
        {creditPools.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations.poolsTable.order_no}</TableHead>
                <TableHead>{translations.poolsTable.balance}</TableHead>
                <TableHead>{translations.poolsTable.earned}</TableHead>
                <TableHead>{translations.poolsTable.created_at}</TableHead>
                <TableHead>{translations.poolsTable.expired_at}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditPools.map((pool, index) => (
                <TableRow key={pool.order_no || `bonus-${index}`}>
                  <TableCell>
                    {pool.order_no || translations.bonus}
                  </TableCell>
                  <TableCell className="font-medium">{pool.balance}</TableCell>
                  <TableCell className="text-green-600">
                    +{pool.earned}
                  </TableCell>
                  <TableCell>
                    <LocalTime date={pool.created_at} format="date" />
                  </TableCell>
                  <TableCell>
                    <LocalTime date={pool.expired_at} format="date" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {translations.noCredits}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
