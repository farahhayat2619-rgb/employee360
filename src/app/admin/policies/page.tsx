import { PolicyAdmin } from "@/components/records-views";
import { listPolicies, POLICY_CATEGORIES } from "@/lib/records";

export default async function AdminPolicies() {
  const policies = await listPolicies("admin");
  return <PolicyAdmin policies={policies} categories={POLICY_CATEGORIES} />;
}
