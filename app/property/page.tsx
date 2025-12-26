import { Suspense } from "react";

import PropertyPageClient from "./PropertyPageClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PropertyPageClient />
    </Suspense>
  );
}
