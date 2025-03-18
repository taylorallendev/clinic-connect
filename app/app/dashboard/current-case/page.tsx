import { Suspense } from "react";
import { CurrentCaseSkeleton } from "./current-case-skeleton";
import CurrentCaseContent from "./refactored-content";

export default function CurrentCasePage() {
  return (
      <div className="flex-1 overflow-auto bg-white light current-case-page">
        <Suspense fallback={<CurrentCaseSkeleton />}>
          <CurrentCaseContent />
        </Suspense>
      </div>
  );
}