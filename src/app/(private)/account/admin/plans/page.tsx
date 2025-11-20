export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import PageTitle from "@/components/ui/page-title";
import React from "react";
import Link from "next/link";
import { getAllPlans } from "@/actions/plans";
import toast from "react-hot-toast";
import PlansTable from "./_components/plans-table";

async function AdminPlansPage() {
  const response: any = await getAllPlans();
  if (!response.success) {
    return <div>{response.message}</div>;
  }
  console.log(response.data);
  return (
    <div>
      <div className="flex justify-between item-centre">
        <PageTitle title="" />
      </div>
      <PlansTable plans={response.data} />
    </div>
  );
}

export default AdminPlansPage;
