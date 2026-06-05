import { Suspense } from "react";
import { PagoClient } from "./PagoClient";

export default function PagoPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Suspense fallback={<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}>
        <PagoClient />
      </Suspense>
    </div>
  );
}
