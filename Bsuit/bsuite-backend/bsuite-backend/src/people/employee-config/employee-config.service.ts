import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { DataSource, ILike } from "typeorm";
import { Designation } from "./entities/tenant.desgination.entity";
import { Department } from "./entities/tenant.deparment.entity";
import { SubDepartment } from "./entities/tenant.sub-department.entity";

@Injectable()
export class DesignationService {
  async findOne(dataSource: DataSource, designationId: number) {
    const repository = dataSource.getRepository(Designation);
    const designation = await repository.findOne({
      where: { id: designationId },
    });
    if (!designation)
      throw new NotFoundException(
        `Designation with ID '${designationId}' not found`,
      );
    return designation;
  }

  async create(dataSource: DataSource, designationName: string) {
    const repository = dataSource.getRepository(Designation);
    const exists = await repository.findOne({
      where: { designationName: ILike(designationName) },
    });
    if (exists) {
      throw new ConflictException(
        `Designation with name "${designationName}" already exists.`,
      );
    }

    const designation = repository.create({
      designationName,
    });
    const result = await repository.save(designation);
    return {
      data: result,
      change_of_data: {
        id: result.id,
        designationName: result.designationName,
        module: "Payroll",
        feature: "Designation",
        status: "Create",
      },
    };
  }

  async findAll(dataSource: DataSource) {
    const repository = dataSource.getRepository(Designation);
    return await repository.find();
  }

  async update(
    dataSource: DataSource,
    designationId: number,
    designationName: string,
  ) {
    const repository = dataSource.getRepository(Designation);
    const designation = await this.findOne(dataSource, designationId);

    if (designationName) {
      const exists = await repository.findOne({
        where: {
          designationName: ILike(designationName),
        },
      });
      if (exists && exists.id !== designation.id) {
        throw new ConflictException(
          `Designation with name "${designationName}" already exists.`,
        );
      }
    }
    const result = await repository.save(designation);
    return {
      data: result,
      change_of_data: {
        id: result.id,
        designationName: result.designationName,
        module: "Payroll",
        feature: "Designation",
        status: "Update",
      },
    };
  }

  async remove(dataSource: DataSource, designationId: number) {
    const repository = dataSource.getRepository(Designation);
    const designation = await this.findOne(dataSource, designationId);
    if (!designation) throw new BadRequestException("Designation Not Found");
    await repository.remove(designation);
    return {
      change_of_data: {
        id: designation.id,
        designationName: designation.designationName,
        module: "Payroll",
        feature: "Designation",
        status: "Delete",
      },
    };
  }
}

@Injectable()
export class DepartmentService {
  async findOne(
    dataSource: DataSource,
    departmentId: number,
  ) {
    const repository = dataSource.getRepository(Department);
    const department = await repository.findOne({
      where: { id: departmentId },
    });
    if (!department)
      throw new NotFoundException(
        `Department with ID '${departmentId}' not found`,
      );
    return department;
  }

  async create(dataSource: DataSource, departmentName: string) {
    const repository = dataSource.getRepository(Department);
    const exists = await repository.findOne({
      where: { departmentName: ILike(departmentName) },
    });
    if (exists) {
      throw new ConflictException(
        `Department with name "${departmentName}" already exists.`,
      );
    }

    const department = repository.create({
      departmentName,
    });
    const result = await repository.save(department);
    return {
      data: result,
      change_of_data: {
        id: result.id,
        departmentName: result.departmentName,
        module: "Payroll",
        feature: "Department",
        status: "Create",
      },
    };
  }

  async findAll(dataSource: DataSource){
    const repository = dataSource.getRepository(Department);
    return await repository.find();
  }

  async update(
    dataSource: DataSource,
    departmentId: number,
    departmentName: string,
  ) {
    const repository = dataSource.getRepository(Department);
    const department = await this.findOne(dataSource, departmentId);

    if (departmentName) {
      const exists = await repository.findOne({
        where: {
          departmentName: ILike(departmentName),
        },
      });
      if (exists && exists.id !== department.id) {
        throw new ConflictException(
          `Department with name "${departmentName}" already exists.`,
        );
      }
      department.departmentName = departmentName;
    }

    const result = await repository.save(department);
    return {
      data: result,
      change_of_data: {
        id: result.id,
        departmentName: result.departmentName,
        module: "Payroll",
        feature: "Department",
        status: "Update",
      },
    };
  }

  async remove(dataSource: DataSource, departmentId: number) {
    const departmentRepo = dataSource.getRepository(Department);
    const subDepartmentRepo = dataSource.getRepository(SubDepartment);
    const department = await this.findOne(dataSource, departmentId);

    const subDepartmentExists = await subDepartmentRepo.findOne({
      where: { department: { id: departmentId } },
    });

    if (subDepartmentExists)
      throw new ForbiddenException(
        "Cannot Delete Department With Subdepartment",
      );

    await departmentRepo.remove(department);
    return {
      change_of_data: {
        id: department.id,
        departmentName: department.departmentName,
        module: "Payroll",
        feature: "Department",
        status: "Delete",
      },
    };
  }
}

@Injectable()
export class SubDepartmentService {
  async findOne(
    dataSource: DataSource,
    subDepartmentId: number,
  ){
    const subDepartmentRepo = dataSource.getRepository(SubDepartment);

    const subDepartment = await subDepartmentRepo.findOne({
      where: { id: subDepartmentId },
      relations: ["department"],
    });
    if (!subDepartment)
      throw new NotFoundException(
        `SubDepartment with ID '${subDepartmentId}' not found`,
      );
    return subDepartment;
  }

  async create(
    dataSource: DataSource,
    subDepartmentName: string,
    departmentId: number,
  ) {
    const subDepartmentRepo = dataSource.getRepository(SubDepartment);
    const departmentRepo = dataSource.getRepository(Department);

    const departmentExists = await departmentRepo.findOne({
      where: { id: departmentId },
    });
    if (!departmentExists)
      throw new ForbiddenException("Department Does Not Exist!");

    const exists = await subDepartmentRepo.findOne({
      where: {
        subDepartmentName: ILike(subDepartmentName),
        department: { id: departmentId },
      },
    });
    if (exists) {
      throw new ConflictException(
        `SubDepartment with name "${subDepartmentName}" for department ${departmentExists.departmentName} already exists.`,
      );
    }

    const subDepartment = subDepartmentRepo.create({
      subDepartmentName,
      department: departmentExists,
    });
    const result = await subDepartmentRepo.save(subDepartment);

    return {
      data: result,
      change_of_data: {
        id: result.id,
        subDepartmentName: result.subDepartmentName,
        module: "Payroll",
        feature: "SubDepartment",
        status: "Create",
      },
    };
  }

  async findAll(
    dataSource: DataSource,
    departmentId: number,
  ){
    const subDepartmentRepo = dataSource.getRepository(SubDepartment);
    const departmentRepo = dataSource.getRepository(Department);

    const departmentExists = await departmentRepo.findOne({
      where: { id: departmentId },
    });
    if (!departmentExists)
      throw new ForbiddenException("Department Does Not Exist!");

    return await subDepartmentRepo.find({
      where: { department: { id: departmentId } },
    });
  }

  async update(
    dataSource: DataSource,
    subDepartmentId: number,
    subDepartmentName: string,
  ) {
    const subDepartmentRepo = dataSource.getRepository(SubDepartment);
    const subDepartment = await this.findOne(dataSource, subDepartmentId);

    if (subDepartmentName) {
      const exists = await subDepartmentRepo.findOne({
        where: {
          subDepartmentName: ILike(subDepartmentName),
          department: { id: subDepartment.department.id },
        },
      });
      if (exists && exists.id !== subDepartment.id) {
        throw new ConflictException(
          `SubDepartment with name "${subDepartmentName}" already exists.`,
        );
      }
      subDepartment.subDepartmentName = subDepartmentName;
    }

    const result = await subDepartmentRepo.save(subDepartment);
    return {
      data: result,
      change_of_data: {
        id: result.id,
        subDepartmentName: result.subDepartmentName,
        module: "Payroll",
        feature: "SubDepartment",
        status: "Update",
      },
    };
  }

  async remove(dataSource: DataSource, subDepartmentId: number) {
    const subDepartmentRepo = dataSource.getRepository(SubDepartment);
    const subDepartment = await this.findOne(dataSource, subDepartmentId);

    await subDepartmentRepo.remove(subDepartment);
    return {
      change_of_data: {
        id: subDepartment.id,
        subDepartmentName: subDepartment.subDepartmentName,
        module: "Payroll",
        feature: "SubDepartment",
        status: "Delete",
      },
    };
  }
}
