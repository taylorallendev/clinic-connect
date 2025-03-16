import { Suspense } from "react";
import { CaseWrapper } from "../shared/case-wrapper";
import { CurrentCaseSkeleton } from "./current-case-skeleton";

export default function CurrentCasePage() {
  return (
      <div className="flex-1 overflow-auto bg-gradient-to-br from-blue-950 to-indigo-950">
        <Suspense fallback={<CurrentCaseSkeleton />}>
          <CaseWrapper />
        </Suspense>
      </div>
  );
}