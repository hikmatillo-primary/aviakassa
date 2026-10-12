import { AppContainer } from "@/components/AppContainer";
import {
  getDashboardStats,
  getBatchesWithDetails,
  getSalesWithDetails,
  getPaymentsWithDetails,
  getPartnersWithBalances,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, batches, sales, payments, partners] = await Promise.all([
    getDashboardStats(),
    getBatchesWithDetails(),
    getSalesWithDetails(),
    getPaymentsWithDetails(),
    getPartnersWithBalances(),
  ]);

  return (
    <AppContainer
      initialStats={stats}
      initialBatches={batches}
      initialSales={sales}
      initialPayments={payments}
      initialPartners={partners}
    />
  );
}
