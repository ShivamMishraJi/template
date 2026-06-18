"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { EmployeeExcelImportDialog } from "@/features/employees/employee-excel-import-dialog";
import { EmployeeMasterFormFields } from "@/features/employees/employee-master-form-fields";
import {
  employeesPanelBodyClassName,
  employeesPanelClassName,
  employeesPanelFooterClassName,
  employeesPanelHeaderClassName,
} from "@/features/employees/employees-panel-styles";
import {
  emptyPayrollEmployeeFormAddValues,
  payrollEmployeeFormAddSchema,
  type PayrollEmployeeFormAddValues,
} from "@/lib/payroll-employee-schema";
import { createPayrollEmployee } from "@/lib/payroll-employees-api";

export function AddEmployeePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const form = useForm<PayrollEmployeeFormAddValues>({
    resolver: zodResolver(payrollEmployeeFormAddSchema),
    defaultValues: {
      ...emptyPayrollEmployeeFormAddValues,
      dateOfJoining: new Date().toISOString().slice(0, 10),
      employmentStatus: "active",
    },
  });

  async function onSubmit(values: PayrollEmployeeFormAddValues) {
    setSubmitting(true);
    try {
      const result = await createPayrollEmployee(values);
      if (!result.ok) {
        form.setError("agencyIdNo", { type: "manual", message: result.error });
        return;
      }
      router.push("/employees");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={employeesPanelClassName}>
      <div className={employeesPanelHeaderClassName}>
        <Button variant="ghost" className="h-9 gap-2 px-2 text-muted-foreground hover:text-foreground" asChild>
          <Link href="/employees">
            <ArrowLeft className="h-4 w-4" />
            Back to employees
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => setImportOpen(true)}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Import Excel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className={employeesPanelBodyClassName}>
            <EmployeeMasterFormFields variant="add" control={form.control} form={form} />
          </div>

          <div className={employeesPanelFooterClassName}>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Create employee"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/employees">Cancel</Link>
            </Button>
          </div>
        </form>
      </Form>

      <EmployeeExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => router.push("/employees")}
      />
    </div>
  );
}
