// Utility functions for biometric operations
// These are NOT server actions, just helper functions

export const generateBiometricDeviceId = (userId: number): string => {
  const paddedId = userId.toString().padStart(3, '0');
  return `PFG${paddedId}`;
};

export interface AddEmployeeParams {
  action: "AddEmployee";
  params: {
    APIKey: string;
    EmployeeCode: string;
    EmployeeName: string;
    CardNumber: string;
    SerialNumber: string;
    UserName: string;
    UserPassword: string;
    CommandId: number;
  };
}

export interface DeleteUserParams {
  action: "DeleteUser";
  params: {
    APIKey: string;
    EmployeeCode: string;
    SerialNumber: string;
    UserName: string;
    UserPassword: string;
    CommandId: number;
  };
}

export interface EnrollUserFPParams {
  action: "EnrollUserFP";
  params: {
    APIKey: string;
    EmployeeCode: string;
    FingerIndexNumber: string;
    isOverWrite: string;
    SerialNumber: string;
    UserName: string;
    UserPassword: string;
    CommandId: number;
  };
}

export interface BlockUnblockUserParams {
  action: "BlockUnblockUser";
  params: {
    APIKey: string;
    EmployeeCode: string;
    EmployeeName: string;
    SerialNumber: string;
    IsBlock: string;
    UserName: string;
    UserPassword: string;
    CommandId: number;
  };
}

export const createBiometricPayload = (
  employeeCode: string,
  employeeName: string,
  serialNumber: string
): AddEmployeeParams => {
  return {
    action: "AddEmployee",
    params: {
      APIKey: "essl",
      EmployeeCode: employeeCode,
      EmployeeName: employeeName,
      CardNumber: "0",
      SerialNumber: serialNumber,
      UserName: "esslapi",
      UserPassword: "esslApi@123",
      CommandId: 1,
    },
  };
};

export const createDeleteUserPayload = (
  employeeCode: string,
  serialNumber: string
): DeleteUserParams => {
  return {
    action: "DeleteUser",
    params: {
      APIKey: "essl",
      EmployeeCode: employeeCode,
      SerialNumber: serialNumber,
      UserName: "esslapi",
      UserPassword: "esslApi@123",
      CommandId: 1,
    },
  };
};

export const createEnrollFingerprintPayload = (
  employeeCode: string,
  serialNumber: string,
  fingerIndex: string = "1",
  overwrite: boolean = false
): EnrollUserFPParams => {
  return {
    action: "EnrollUserFP",
    params: {
      APIKey: "essl",
      EmployeeCode: employeeCode,
      FingerIndexNumber: fingerIndex,
      isOverWrite: overwrite ? "1" : "0",
      SerialNumber: serialNumber,
      UserName: "esslapi",
      UserPassword: "esslApi@123",
      CommandId: 1,
    },
  };
};

export const createBlockUnblockUserPayload = (
  employeeCode: string,
  employeeName: string,
  serialNumber: string,
  block: boolean = false
): BlockUnblockUserParams => {
  return {
    action: "BlockUnblockUser",
    params: {
      APIKey: "essl",
      EmployeeCode: employeeCode,
      EmployeeName: employeeName,
      SerialNumber: serialNumber,
      IsBlock: block ? "1" : "0",
      UserName: "esslapi",
      UserPassword: "esslApi@123",
      CommandId: 1,
    },
  };
};
