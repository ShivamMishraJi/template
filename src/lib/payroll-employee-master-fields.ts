/**
 * Single source of truth: column order and exact labels from
 * "Master Data - Agency Manpower" in MASTER DATA - KRC CINEVISTA- KANJUR.xlsx
 */

export type MasterFieldFormType =
  | "text"
  | "textarea"
  | "date"
  | "gender"
  | "employmentYn";

export type MasterEmployeeFieldKey =
  | "sNo"
  | "stateCity"
  | "siteName"
  | "employmentStatusYn"
  | "agencyName"
  | "agencyIdNo"
  | "krcSiteBiometricIdNo"
  | "dateOfJoining"
  | "lastWorkingDay"
  | "designation"
  | "nameOfEmployee"
  | "empFatherSpouseName"
  | "dateOfBirth"
  | "gender"
  | "bloodGroup"
  | "employmentApplicationStatus"
  | "educationCertificate"
  | "aadharNumber"
  | "panNumber"
  | "uanPfNo"
  | "esicNo"
  | "bankName"
  | "bankAccountNumber"
  | "bankIfscNumber"
  | "pccApplicationNo"
  | "pccApplicationDate"
  | "pccNo"
  | "pccIssueDate"
  | "policeVerificationValidity"
  | "currentAddress"
  | "permanentAddress"
  | "phoneNumber"
  | "nextOfKinName"
  | "nextOfKinContactNumber";

export type MasterEmployeeFieldDef = {
  key: MasterEmployeeFieldKey;
  label: string;
  formType: MasterFieldFormType;
  tableMinWidth?: number;
};

export const MASTER_DATA_EMPLOYEE_FIELDS: MasterEmployeeFieldDef[] = [
  { key: "stateCity", label: "STATE/CITY", formType: "text", tableMinWidth: 100 },
  { key: "siteName", label: "SITE NAME", formType: "text", tableMinWidth: 180 },
  {
    key: "employmentStatusYn",
    label: "EMPLOYMENT STATUS (ACTIVE - Y/N)",
    formType: "employmentYn",
    tableMinWidth: 120,
  },
  { key: "agencyName", label: "AGENCY NAME", formType: "text", tableMinWidth: 140 },
  { key: "agencyIdNo", label: "AGENCY ID NO", formType: "text", tableMinWidth: 100 },
  {
    key: "krcSiteBiometricIdNo",
    label: "KRC SITE BIOMETRIC ID NO.",
    formType: "text",
    tableMinWidth: 120,
  },
  { key: "dateOfJoining", label: "DATE OF JOINING", formType: "date", tableMinWidth: 110 },
  { key: "lastWorkingDay", label: "LAST WORKING DAY", formType: "date", tableMinWidth: 110 },
  { key: "designation", label: "DESIGNATION", formType: "text", tableMinWidth: 120 },
  { key: "nameOfEmployee", label: "NAME OF EMPLOYEE", formType: "text", tableMinWidth: 160 },
  {
    key: "empFatherSpouseName",
    label: "EMP_FATHER/SPOUSE NAME",
    formType: "text",
    tableMinWidth: 150,
  },
  { key: "dateOfBirth", label: "DATE OF BIRTH", formType: "date", tableMinWidth: 110 },
  { key: "gender", label: "GENDER", formType: "gender", tableMinWidth: 80 },
  { key: "bloodGroup", label: "BLOOD GROUP", formType: "text", tableMinWidth: 72 },
  {
    key: "employmentApplicationStatus",
    label: "EMPLOYEMENT APPLICATION STATUS  (YES/NO)",
    formType: "text",
    tableMinWidth: 140,
  },
  {
    key: "educationCertificate",
    label: "EDUCATION CERTIFICATE (YES/NO)",
    formType: "text",
    tableMinWidth: 130,
  },
  { key: "aadharNumber", label: "AADHAR NUMBER", formType: "text", tableMinWidth: 130 },
  { key: "panNumber", label: "PAN NUMBER", formType: "text", tableMinWidth: 110 },
  { key: "uanPfNo", label: "UAN / PF NO.", formType: "text", tableMinWidth: 120 },
  { key: "esicNo", label: "ESIC NO.", formType: "text", tableMinWidth: 110 },
  { key: "bankName", label: "BANK NAME", formType: "text", tableMinWidth: 120 },
  { key: "bankAccountNumber", label: "BANK A/C NUMBER", formType: "text", tableMinWidth: 130 },
  { key: "bankIfscNumber", label: "BANK IFSC NUMBER", formType: "text", tableMinWidth: 120 },
  { key: "pccApplicationNo", label: "PCC  APPLICATION NO.", formType: "text", tableMinWidth: 130 },
  { key: "pccApplicationDate", label: "PCC  APPLICATION DATE", formType: "date", tableMinWidth: 110 },
  { key: "pccNo", label: "PCC NO.", formType: "text", tableMinWidth: 100 },
  { key: "pccIssueDate", label: "PCC  ISSUE DATE", formType: "date", tableMinWidth: 110 },
  {
    key: "policeVerificationValidity",
    label: "POLICE VERIFICATION VALIDITY",
    formType: "text",
    tableMinWidth: 140,
  },
  { key: "currentAddress", label: "CURRENT ADDRESS", formType: "textarea", tableMinWidth: 200 },
  { key: "permanentAddress", label: "PERMANENT ADDRESS", formType: "textarea", tableMinWidth: 200 },
  { key: "phoneNumber", label: "PHONE NUMBER", formType: "text", tableMinWidth: 110 },
  {
    key: "nextOfKinName",
    label: "NEXT OF KIN / GAURDIAN NAME",
    formType: "text",
    tableMinWidth: 150,
  },
  {
    key: "nextOfKinContactNumber",
    label: "NEXT OF KIN / GAURDIAN  CONTACT NUMBER",
    formType: "text",
    tableMinWidth: 150,
  },
];

export const MASTER_DATA_TEMPLATE_HEADERS: string[] = MASTER_DATA_EMPLOYEE_FIELDS.map(
  (f) => f.label,
);

export function labelForMasterField(key: MasterEmployeeFieldKey): string {
  const f = MASTER_DATA_EMPLOYEE_FIELDS.find((c) => c.key === key);
  return f?.label ?? key;
}

/** Normalized Excel header → schema field key */
export const EXCEL_HEADER_TO_FIELD_KEY: Record<string, MasterEmployeeFieldKey> = {
  "S/NO": "sNo",
  "S.NO.": "sNo",
  "SR NO": "sNo",
  "STATE/CITY": "stateCity",
  "SITE NAME": "siteName",
  "EMPLOYMENT STATUS (ACTIVE - Y/N)": "employmentStatusYn",
  "AGENCY NAME": "agencyName",
  "AGENCY ID NO": "agencyIdNo",
  "AGENCY ID": "agencyIdNo",
  "EMPLOYEE ID": "agencyIdNo",
  "KRC SITE BIOMETRIC ID NO.": "krcSiteBiometricIdNo",
  "DATE OF JOINING": "dateOfJoining",
  "DATE OF JOINING (DOJ)": "dateOfJoining",
  "LAST WORKING DAY": "lastWorkingDay",
  DESIGNATION: "designation",
  "EMPLOYEE DESIGNATION": "designation",
  "NAME OF EMPLOYEE": "nameOfEmployee",
  "EMP_FATHER/SPOUSE NAME": "empFatherSpouseName",
  "FATHER'S / HUSBAND NAME": "empFatherSpouseName",
  "FATHERS / HUSBAND NAME": "empFatherSpouseName",
  "DATE OF BIRTH": "dateOfBirth",
  GENDER: "gender",
  "GENDER (M/F)": "gender",
  "BLOOD GROUP": "bloodGroup",
  "EMPLOYEMENT APPLICATION STATUS (YES/NO)": "employmentApplicationStatus",
  "EMPLOYEMENT APPLICATION STATUS  (YES/NO)": "employmentApplicationStatus",
  "EDUCATION CERTIFICATE (YES/NO)": "educationCertificate",
  "AADHAR NUMBER": "aadharNumber",
  "AADHAAR NUMBER": "aadharNumber",
  "AADHAR NO": "aadharNumber",
  "PAN NUMBER": "panNumber",
  "PAN NO": "panNumber",
  "UAN / PF NO.": "uanPfNo",
  "UAN NO (PF NO)": "uanPfNo",
  "ESIC NO.": "esicNo",
  "ESIC NO (IP NO)": "esicNo",
  "BANK NAME": "bankName",
  "BANK A/C NUMBER": "bankAccountNumber",
  "BANK A/C NO": "bankAccountNumber",
  "BANK IFSC NUMBER": "bankIfscNumber",
  "IFSC CODE": "bankIfscNumber",
  "PCC APPLICATION NO.": "pccApplicationNo",
  "PCC  APPLICATION NO.": "pccApplicationNo",
  "PCC APPLICATION DATE": "pccApplicationDate",
  "PCC  APPLICATION DATE": "pccApplicationDate",
  "PCC NO.": "pccNo",
  "PCC ISSUE DATE": "pccIssueDate",
  "PCC  ISSUE DATE": "pccIssueDate",
  "POLICE VERIFICATION VALIDITY": "policeVerificationValidity",
  "POLICE VERIFICATION (YES/NO)": "policeVerificationValidity",
  "CURRENT ADDRESS": "currentAddress",
  "PERMANENT ADDRESS": "permanentAddress",
  "PERMANENT ADDRESS (VILLAGE, POST, DIST, STATE, PIN CODE)": "permanentAddress",
  "PHONE NUMBER": "phoneNumber",
  "CONTACT NO": "phoneNumber",
};

const ID_HEADER_PRIORITY: Record<string, number> = {
  "AGENCY ID NO": 10,
  "AGENCY ID": 10,
  "EMPLOYEE ID": 10,
  "KRC SITE BIOMETRIC ID NO.": 5,
  "S/NO": 1,
  "S.NO.": 1,
  "SR NO": 1,
};

export function buildExcelHeaderIndex(headers: unknown[]): Map<MasterEmployeeFieldKey, number> {
  const map = new Map<MasterEmployeeFieldKey, number>();
  headers.forEach((h, idx) => {
    const norm = String(h ?? "")
      .replace(/\r\n/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
    const key = EXCEL_HEADER_TO_FIELD_KEY[norm];
    if (!key) return;
    if (map.has(key)) {
      const existingNorm = String(headers[map.get(key)!] ?? "")
        .replace(/\r\n/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
      const existingPri = ID_HEADER_PRIORITY[existingNorm] ?? 0;
      const newPri = ID_HEADER_PRIORITY[norm] ?? 0;
      if (newPri <= existingPri) return;
    }
    map.set(key, idx);
  });
  return map;
}
