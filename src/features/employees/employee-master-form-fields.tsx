"use client";

import type { Control, FieldValues, UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  employeeFormDateClassName,
  employeeFormFieldClassName,
  employeeFormSectionCardAccentClassName,
  employeeFormSectionCardClassName,
  employeeNativeSelectClassName,
} from "@/features/employees/employee-form-styles";
import {
  EMPLOYEE_FORM_ID_BANKING_FIELDS,
  EMPLOYEE_FORM_MASTER_DATA_FIELDS,
  EMPLOYEE_FORM_TOP_FIELDS,
  labelForMasterField,
  type MasterEmployeeFieldKey,
} from "@/lib/payroll-employee-master-fields";
import type {
  Gender,
  PayrollEmployeeFormAddValues,
  PayrollEmployeeFormValues,
} from "@/lib/payroll-employee-schema";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS: readonly Gender[] = ["male", "female", "other", "prefer_not_to_say"];

const genderLabels: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

function digitAmountInputProps(
  value: number,
  onChange: (n: number) => void,
): Pick<
  React.ComponentProps<typeof Input>,
  "type" | "inputMode" | "value" | "onChange" | "autoComplete"
> {
  return {
    type: "text",
    inputMode: "numeric",
    autoComplete: "off",
    value: value === 0 ? "" : String(value),
    onChange: (e) => {
      const digits = e.target.value.replace(/\D/g, "");
      onChange(digits === "" ? 0 : Number.parseInt(digits, 10));
    },
  };
}

type Props =
  | {
      variant: "add";
      control: Control<PayrollEmployeeFormAddValues>;
      form: UseFormReturn<PayrollEmployeeFormAddValues>;
    }
  | {
      variant: "edit";
      control: Control<PayrollEmployeeFormValues>;
      form: UseFormReturn<PayrollEmployeeFormValues>;
    };

function renderMasterField(
  fieldKey: MasterEmployeeFieldKey,
  rhfControl: Control<FieldValues>,
  label: string,
  formType: (typeof EMPLOYEE_FORM_MASTER_DATA_FIELDS)[number]["formType"],
  options?: { readOnly?: boolean; placeholder?: string },
) {
  if (fieldKey === "agencyIdNo" && formType === "text") {
    return (
      <FormField
        key={fieldKey}
        control={rhfControl}
        name={fieldKey}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                placeholder={
                  options?.placeholder ??
                  "From Excel AGENCY ID NO — leave blank for auto ID"
                }
                className={employeeFormFieldClassName}
                readOnly={options?.readOnly}
                disabled={options?.readOnly}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (formType === "textarea") {
    return (
      <FormField
        key={fieldKey}
        control={rhfControl}
        name={fieldKey}
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Textarea rows={2} className={cn("resize-y text-sm", employeeFormFieldClassName)} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (formType === "date") {
    return (
      <FormField
        key={fieldKey}
        control={rhfControl}
        name={fieldKey}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input type="date" className={cn("text-sm", employeeFormDateClassName)} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (formType === "gender") {
    return (
      <FormField
        key={fieldKey}
        control={rhfControl}
        name={fieldKey}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <select
                className={employeeNativeSelectClassName}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              >
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {genderLabels[opt]}
                  </option>
                ))}
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (formType === "employmentYn") {
    return (
      <FormField
        key={fieldKey}
        control={rhfControl}
        name={fieldKey}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <select
                className={employeeNativeSelectClassName}
                value={field.value || "Y"}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              >
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      key={fieldKey}
      control={rhfControl}
      name={fieldKey}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              className={cn("text-sm", employeeFormFieldClassName)}
              readOnly={options?.readOnly}
              disabled={options?.readOnly}
              placeholder={options?.placeholder}
              {...field}
              value={field.value ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function EmployeeMasterFormFields({ variant, control }: Props) {
  const rhfControl = control as unknown as Control<FieldValues>;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {EMPLOYEE_FORM_TOP_FIELDS.map((def) =>
          renderMasterField(
            def.key,
            rhfControl,
            def.label,
            def.formType,
            def.key === "agencyIdNo"
              ? {
                  readOnly: variant === "edit",
                  placeholder:
                    variant === "edit" ? undefined : "Leave blank for auto ID",
                }
              : undefined,
          ),
        )}
      </div>

      <Card className={employeeFormSectionCardClassName}>
        <CardHeader>
          <CardTitle className="text-lg">Identity &amp; banking</CardTitle>
          <CardDescription>
            Government IDs and bank details used on payslips and payroll records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EMPLOYEE_FORM_ID_BANKING_FIELDS.map((def) =>
              renderMasterField(def.key, rhfControl, def.label, def.formType),
            )}
          </div>
        </CardContent>
      </Card>

      <Card className={employeeFormSectionCardAccentClassName}>
        <CardHeader>
          <CardTitle className="text-lg">Master Data</CardTitle>
          <CardDescription>
            Remaining KRC Excel sheet fields ({EMPLOYEE_FORM_MASTER_DATA_FIELDS.length} columns).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EMPLOYEE_FORM_MASTER_DATA_FIELDS.map((def) =>
              renderMasterField(def.key, rhfControl, def.label, def.formType),
            )}
          </div>
        </CardContent>
      </Card>

      <Card className={employeeFormSectionCardClassName}>
        <CardHeader>
          <CardTitle className="text-lg">Payroll (system)</CardTitle>
          <CardDescription>
            Not in the Excel sheet — used for monthly salary and payslip generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["salaryBasic", "BASIC SALARY (monthly)"],
                ["salaryDa", "DA"],
                ["salaryHra", "HRA"],
                ["salaryConveyance", "CONVEYANCE"],
                ["salaryEducationAllowance", "EDUCATION ALLOWANCE"],
                ["salaryLta", "LTA"],
                ["salaryWashingAllowance", "WASHING ALLOWANCE"],
                ["salaryOtherAllowance", "OTHER ALLOWANCE"],
                ["salaryOtRate", "OT RATE"],
              ] as const
            ).map(([name, label]) => (
              <FormField
                key={name}
                control={rhfControl}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        placeholder="0"
                        className={employeeFormFieldClassName}
                        {...digitAmountInputProps(field.value as number, field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { labelForMasterField };
