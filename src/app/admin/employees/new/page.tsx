import { Suspense } from "react";
import { EmployeeForm } from "@/components/employee-form";
import { PageHeader } from "@/components/ui";
import { employees } from "@/lib/sample-data";

async function FormLoader({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const existing = edit ? employees.find((e) => e.id === edit) : undefined;
  return (
    <>
      <PageHeader
        title={existing ? `Edit ${existing.name}` : "Register Employee"}
        subtitle={existing ? `${existing.id} · changes are saved to the audit log.` : "Creates the employee record and their Employee360 login. They get an email to set a password."}
      />
      <EmployeeForm existing={existing} />
    </>
  );
}

export default function Page(props: PageProps<"/admin/employees/new">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
      <FormLoader searchParams={props.searchParams as Promise<{ edit?: string }>} />
    </Suspense>
  );
}
