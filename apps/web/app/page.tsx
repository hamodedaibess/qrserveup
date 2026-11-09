import { RequestContext } from "@qrserveup/types";

export default function Home() {
  const dummyContext: RequestContext = { tenantId: "1", branchId: "1", userId: "1", permissions: [] };
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>QRServeUp Platform</h1>
      <p>Phase 1 Foundation is running!</p>
      <p>Context loaded for tenant: {dummyContext.tenantId}</p>
    </main>
  );
}
