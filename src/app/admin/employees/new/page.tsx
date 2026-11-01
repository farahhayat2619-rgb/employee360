import { notFound } from "next/navigation";
import { EmployeeForm } from "@/components/employee-form";
import { PageHeader } from "@/components/ui";
import { employeeFormOptions, getEditableEmployee, nextEmployeeId } from "@/lib/queries";

export default async function Page(props: PageProps<"/admin/employees/new">) {
  const { edit } = (await props.searchParams) as { edit?: string };
  const options = await employeeFormOptions(); // authorizes Admin / HR
  const existing = edit ? await getEditableEmployee(edit) : null;
  if (edit && !existing) notFound();
  const nextId = await nextEmployeeId();
  return (
    <>
      <PageHeader
        title={existing ? `Edit ${existing.name}` : "Register Employee"}
        subtitle={existing ? `${existing.id} · every change is recorded in the audit log.` : "Creates the employee record and their Employee360 login with a one-time password."}
      />
      <EmployeeForm key={existing?.id ?? "new"} existing={existing} nextId={nextId} {...options} />
    </>
  );
}
