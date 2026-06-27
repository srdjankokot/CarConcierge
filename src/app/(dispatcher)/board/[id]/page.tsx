"use client";

import { useParams } from "next/navigation";
import { RequestDetailBody } from "@/components/board/RequestDetailBody";

export default function DispatcherRequestDetailPage() {
  const params = useParams<{ id: string }>();
  return <RequestDetailBody requestId={params.id} />;
}
