import { PolicyLibrary } from "@/components/records-views";
import { listPolicies, POLICY_CATEGORIES } from "@/lib/records";

export default async function PoliciesPage() {
  const policies = await listPolicies("employee");
  return <PolicyLibrary policies={policies} categories={POLICY_CATEGORIES} />;
}
