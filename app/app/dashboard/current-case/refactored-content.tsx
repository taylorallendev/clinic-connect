"use client";

import { useSearchParams } from "next/navigation";
import { CurrentCaseWrapper } from "./components/current-case-wrapper";

export default function CurrentCaseContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get("id");
  
  return <CurrentCaseWrapper initialCaseId={caseId || undefined} />;
}