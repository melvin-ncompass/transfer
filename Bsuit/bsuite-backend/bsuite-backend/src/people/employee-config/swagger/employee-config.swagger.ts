import { DepartmentResponseDto } from "./response-dto/department-response.dto";
import { DesignationResponseDto } from "./response-dto/designation-response.dto";
import { SubDepartmentResponseDto } from "./response-dto/sub-department.dto";

export const employeeConfigSwagger = {
  CREATE_DESIGNATION: {
    summary: "Create Designation",
    description: "Create a new designation",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      {
        status: 201,
        description: "Designation Created Successfully",
        dataType: DesignationResponseDto,
      },
    ],
  },

  GET_ALL_DESIGNATIONS: {
    summary: "Get All Designations",
    description: "Retrieve a list of all designations",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      {
        status: 200,
        description: "Designations Retrieved Successfully",
        dataType: [DesignationResponseDto],
      },
    ],
  },

  GET_ONE_DESIGNATION: {
    summary: "Get Designation By ID",
    description: "Retrieve a single designation using its ID",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      {
        status: 200,
        description: "Designation Retrieved Successfully",
        dataType: DesignationResponseDto,
      },
      { status: 404, description: "Designation Not Found" },
    ],
  },

  UPDATE_DESIGNATION: {
    summary: "Update Designation",
    description: "Update an existing designation by ID",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      {
        status: 200,
        description: "Designation Updated Successfully",
        dataType: DesignationResponseDto,
      },
      { status: 404, description: "Designation Not Found" },
    ],
  },

  DELETE_DESIGNATION: {
    summary: "Delete Designation",
    description: "Delete an existing designation by ID",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      { status: 200, description: "Designation Deleted Successfully" },
      { status: 404, description: "Designation Not Found" },
    ],
  },

  CREATE_DEPARTMENT: {
    summary: "Create Department",
    description: "Create a new department",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      {
        status: 201,
        description: "Department Created Successfully",
        dataType: DepartmentResponseDto,
      },
    ],
  },

  GET_ALL_DEPARTMENTS: {
    summary: "Get All Departments",
    description: "Retrieve a list of all departments",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      {
        status: 200,
        description: "Departments Retrieved Successfully",
        dataType: [DepartmentResponseDto],
      },
    ],
  },

  GET_ONE_DEPARTMENT: {
    summary: "Get Department By ID",
    description: "Retrieve a single department using its ID",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      {
        status: 200,
        description: "Department Retrieved Successfully",
        dataType: DepartmentResponseDto,
      },
      { status: 404, description: "Department Not Found" },
    ],
  },

  UPDATE_DEPARTMENT: {
    summary: "Update Department",
    description: "Update an existing department by ID",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      {
        status: 200,
        description: "Department Updated Successfully",
        dataType: DepartmentResponseDto,
      },
      { status: 404, description: "Department Not Found" },
    ],
  },

  DELETE_DEPARTMENT: {
    summary: "Delete Department",
    description: "Delete an existing department by ID",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      { status: 200, description: "Department Deleted Successfully" },
      { status: 404, description: "Department Not Found" },
      {
        status: 403,
        description: "Cannot Delete Department With Subdepartment",
      },
    ],
  },

  CREATE_SUB_DEPARTMENT: {
    summary: "Create Sub-Department",
    description: "Create a new sub-department under a specific department",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      {
        status: 201,
        description: "Sub-Department Created Successfully",
        dataType: SubDepartmentResponseDto,
      },
    ],
  },

  GET_ALL_SUB_DEPARTMENTS: {
    summary: "Get All Sub-Departments",
    description: "Retrieve all sub-departments for a specific department",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      {
        status: 200,
        description: "Sub-Departments Retrieved Successfully",
        dataType: [SubDepartmentResponseDto],
      },
    ],
  },

  GET_ONE_SUB_DEPARTMENT: {
    summary: "Get Sub-Department By ID",
    description: "Retrieve a single sub-department using its ID",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      {
        status: 200,
        description: "Sub-Department Retrieved Successfully",
        dataType: SubDepartmentResponseDto,
      },
      { status: 404, description: "Sub-Department Not Found" },
    ],
  },

  UPDATE_SUB_DEPARTMENT: {
    summary: "Update Sub-Department",
    description: "Update an existing sub-department name by ID",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      {
        status: 200,
        description: "Sub-Department Updated Successfully",
        dataType: SubDepartmentResponseDto,
      },
      { status: 404, description: "Sub-Department Not Found" },
    ],
  },

  DELETE_SUB_DEPARTMENT: {
    summary: "Delete Sub-Department",
    description: "Delete an existing sub-department by ID",
    tags: ["Employee Config"],
    bearerAuth: true,
    cookies: [{ name: "companyId", required: true }],
    responses: [
      { status: 200, description: "Sub-Department Deleted Successfully" },
      { status: 404, description: "Sub-Department Not Found" },
    ],
  },
};
