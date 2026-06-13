import { CreateTaxDto } from "./dto/create-tax.dto";
import { UpdateTaxDto } from "./dto/update-tax.dto";

export const taxSwagger = {
  GET_ALL: {
    summary: "Get all Taxes",
    description: "Fetch all tax records",
    tags: ["Tax"],
    cookies: [{ name: "companyId", required: true }],
    bearerAuth: true,
    responses: [
      { status: 200, description: "Tax fetched successfully" },
    ],
  },

  CREATE: {
    summary: "Create Tax",
    description: "Create a new tax",
    tags: ["Tax"],
    cookies: [{ name: "companyId", required: true }],
    body: [{ type: CreateTaxDto }],
    bearerAuth: true,
    responses: [
      { status: 201, description: "Tax created successfully" },
      { status: 409, description: "Tax with name already exists" },
    ],
  },

  UPDATE: {
    summary: "Update Tax",
    description: "Update an existing tax",
    tags: ["Tax"],
    bearerAuth: true,
    params: [
      {
        name: "taxId",
        type: Number,
        description: "Tax ID",
        required: true,
      },
    ],
    cookies: [{ name: "companyId", required: true }],
    body: [{ type: UpdateTaxDto }],
    responses: [
      { status: 200, description: "Tax updated successfully" },
      { status: 409, description: "Tax with name already exists" },
      { status: 404, description: "Tax not found" },
    ],
  },

  DELETE: {
    summary: "Delete Tax",
    description: "Delete a tax by ID",
    tags: ["Tax"],
    cookies: [{ name: "companyId", required: true }],
    params: [
      {
        name: "taxId",
        type: Number,
        description: "Tax ID",
        required: true,
      },
    ],
    bearerAuth: true,
    responses: [
      { status: 200, description: "Tax deleted successfully" },
      { status: 404, description: "Tax not found" },
    ],
  },

  COUNT: {
    summary: "Get Tax Count",
    description: "Fetch total tax count",
    tags: ["Tax"],
    cookies: [{ name: "companyId", required: true }],
    bearerAuth: true,
    responses: [
      { status: 200, description: "Tax count fetched successfully" },
    ],
  },

  EXPORT: {
    summary: "Export Tax Excel",
    description: "Export tax data as an Excel file",
    tags: ["Tax"],
    cookies: [{ name: "companyId", required: true }],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: "Tax exported successfully (Excel file)",
      },
    ],
  },
};
