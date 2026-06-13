//------------------------------------ Permission List  ------------------------------------------------------------------------

// GET LIST OF PERMISSION (GET)

export interface IPermission {
  id: number;
  permissionName: string;
  permissionNameAbrv: string;
  dependencies?: IPermission[]; 
}

export interface IModulePermissionList {
  moduleName: string;
  app: string;
  permissions: IPermission[];
  children: IModulePermissionList[];
}


export interface IPermissionAPiResponse {
  data :  IModulePermissionList[]
}
//------------------------------------ Role ----------------------------------------------------------------------------------

// CreateRole (POST)

export interface IRoleCreate {
  roleName: string;
  description: string;
  permissionAbrvs: string[];
}

// GetRoles (GET)

export interface IRolePermission {
  id: string;
  permissionName: string;
  permissionNameAbrv: string;
}

// Role User interface
export interface IRoleUser {
  id: string;
  username: string;
  email: string;
  displayName: string; 
}

export interface IRoleDetails {
  id: string;
  roleName: string;
  description: string;
  permissions: IRolePermission[];
  users: IRoleUser[];
}

export interface IGetRoleResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: IRoleDetails[];
}

// update roles

export interface IUpdateRoles {
  id:number
  roleName: string;
  description?: string;
  permissionAbrvs: string[];
}

// GET roles by Id 

export interface IGetRoleByIdData {
  id : number ;
  roleName : string ;
  description : string ;
  permission : string [] ;
  users : IRoleUser[] ;

}
export interface IGetRoleById {
  success: boolean ;
  message : string  ;
  data : IGetRoleByIdData
}
