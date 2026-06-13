import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { ContactCsvMappingDto } from "./dto/contact-csv-mapping.dto";

export const contactSwagger = {
  GET_ALL: {
    summary: "Get all contacts",
    description: "Fetch all contacts",
    tags: ["Contact"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    query: [
      {
        name: "unArchivedOnly",
        type: String,
        required: false,
        description: "Fetch only unarchived contacts",
        example: "true",
      },
    ],
    responses: [{ status: 200, description: "Contacts fetched successfully" }],
  },

  GET_ONE: {
    summary: "Get contact by ID",
    tags: ["Contact"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    params: [{ name: "id", type: Number, required: true }],
    responses: [
      { status: 200, description: "Contact fetched successfully" },
      { status: 404, description: "Not found" },
    ],
  },

  CREATE: {
    summary: "Create contact",
    tags: ["Contact"],
    bearerAuth: true,
    body: { type: CreateContactDto },
    cookies: [{ name: "companyId", required: true }],
    responses: [
      { status: 201, description: "Contact created successfully" },
      { status: 400, description: "Bad error" },
    ],
  },

  UPDATE: {
    summary: "Update contact",
    tags: ["Contact"],
    bearerAuth: true,
    params: [{ name: "id", type: Number, required: true }],
    cookies: [{ name: "companyId", required: true }],
    body: { type: UpdateContactDto },
    responses: [
      { status: 200, description: "Contact updated successfully" },
      { status: 400, description: "Bad error" },
      { status: 404, description: "Not found" },
    ],
  },

  DELETE: {
    summary: "Delete contact",
    tags: ["Contact"],
    bearerAuth: true,
    params: [{ name: "id", type: Number, required: true }],
    responses: [{ status: 200, description: "Contact deleted successfully" },
    { status: 404, description: "Not found" },
    ],
  },

  ARCHIVE: {
    summary: "Archive / Unarchive contact",
    tags: ["Contact"],
    bearerAuth: true,
    params: [{ name: "id", type: Number, required: true }],
    responses: [{ status: 200, description: "Operation successful" },
    { status: 404, description: "Not found" },
    ],
  },

  TOGGLE_REPORT: {
    summary: "Toggle contact report visibility",
    tags: ["Contact"],
    bearerAuth: true,
    params: [{ name: "id", type: Number, required: true }],
    responses: [{ status: 200, description: "Report visibility toggled" }],
  },

  DEMO_CSV: {
    summary: "Download demo CSV",
    tags: ["Contact"],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: "CSV file download",
        rawSchema: {
          type: "string",
          format: "binary",
        },
      },
    ],
  },

  VALIDATE_CSV: {
    summary: "Validate contact CSV",
    tags: ["Contact"],
    bearerAuth: true,
    body: {
      type: ContactCsvMappingDto,
      description: "CSV column mapping",
    },
    responses: [
      { status: 200, description: "CSV validated successfully" },
      { status: 400, description: "CSV validation error" },
    ],
  },

  BULK_CREATE: {
    summary: "Bulk create contacts",
    tags: ["Contact"],
    bearerAuth: true,
    body: {
      type: ContactCsvMappingDto,
    },
    responses: [
      { status: 200, description: "Contacts created successfully" },
    ],
  },

  UPDATE_DUPLICATES: {
    summary: "Update duplicate contacts",
    tags: ["Contact"],
    bearerAuth: true,
    body: {
      type: ContactCsvMappingDto,
    },
    responses: [
      { status: 200, description: "Duplicate contacts updated" },
    ],
  },

  EXPORT: {
    summary: "Export contacts to Excel",
    tags: ["Contact"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      {
        status: 200,
        description: "Excel file download",
        rawSchema: {
          type: "string",
          format: "binary",
        },
      },
    ],
  },
};
