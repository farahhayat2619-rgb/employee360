import { DepartmentInbox } from "@/components/comms-views";
import { departmentInbox } from "@/lib/comms";

export default async function Page() {
  return <DepartmentInbox {...await departmentInbox()} />;
}
