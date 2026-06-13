// placeholderCategories.ts
type PlaceholderCategory = { title: string; items: string[] };

export const PLACEHOLDER_CATEGORIES: PlaceholderCategory[] = [
  {
    title: "ORGANIZATION",
    items: ["Organization_Name", "Organization_Logo"],
  },
  {
    title: "INVOICE",
    items: ["Invoice_Date", "Invoice_Number", "Total", "Due_Date"],
  },
  {
    title: "CUSTOMER",
    items: ["Salutation", "First_Name", "Last_Name", "Email", "Phone"],
  },
];
