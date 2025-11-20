"use server";

import supabase from "@/config/supabase-config";
import { generateBiometricDeviceId } from "@/utils/biometric-helpers";

export interface BiometricDevice {
  id: number;
  serial_no: string;
  device_name?: string;
  location?: string;
  is_active: boolean;
  created_at?: string;
  last_sync?: string;
}

export interface BiometricUser {
  id: number;
  name: string;
  email: string;
  biometric_device_id: string;
  is_bio_metric_active: boolean;
  bio_metric_access: boolean;
  profile_image?: string;
  clerk_url?: string;
  contact_no?: string;
}

const BIOMETRIC_API_URL = "https://n8n.quantandcompany.com/webhook/esslwebapi";

// Get all biometric devices
export const getAllBiometricDevices = async () => {
  try {
    const { data, error } = await supabase
      .from("bio_metric")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Get active biometric devices
export const getActiveBiometricDevices = async () => {
  try {
    const { data, error } = await supabase
      .from("bio_metric")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Get all users with biometric enabled
export const getAllBiometricUsers = async () => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, name, email, biometric_device_id, is_bio_metric_active, bio_metric_access, profile_image, clerk_url, contact_no")
      .or("is_bio_metric_active.eq.true,biometric_device_id.not.is.null")
      .order("name", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data as BiometricUser[],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Send employee to biometric device
export const sendEmployeeToBiometricDevice = async (
  employeeCode: string,
  employeeName: string,
  serialNumber: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const payload = {
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

    console.log("Sending to biometric:", JSON.stringify(payload, null, 2));

    const response = await fetch(BIOMETRIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("Biometric response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }

    return {
      success: response.ok,
      message: response.ok ? "Employee added successfully" : `Error: ${response.status}`,
      data,
    };
  } catch (error: any) {
    console.error("Biometric error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Delete employee from biometric device
export const deleteEmployeeFromBiometricDevice = async (
  employeeCode: string,
  serialNumber: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const payload = {
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

    console.log("Deleting from biometric:", JSON.stringify(payload, null, 2));

    const response = await fetch(BIOMETRIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("Delete response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }

    return {
      success: response.ok,
      message: response.ok ? "Employee deleted successfully" : `Error: ${response.status}`,
      data,
    };
  } catch (error: any) {
    console.error("Delete error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Enroll fingerprint
export const enrollFingerprint = async (
  employeeCode: string,
  serialNumber: string,
  fingerIndex: string = "1"
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const payload = {
      action: "EnrollUserFP",
      params: {
        APIKey: "essl",
        EmployeeCode: employeeCode,
        FingerIndexNumber: fingerIndex,
        isOverWrite: "0",
        SerialNumber: serialNumber,
        UserName: "esslapi",
        UserPassword: "esslApi@123",
        CommandId: 1,
      },
    };

    console.log("Enrolling fingerprint:", JSON.stringify(payload, null, 2));

    const response = await fetch(BIOMETRIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("Enroll response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }

    return {
      success: response.ok,
      message: response.ok ? "Fingerprint enrollment initiated" : `Error: ${response.status}`,
      data,
    };
  } catch (error: any) {
    console.error("Enroll error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Add employee to all active devices
export const addEmployeeToAllDevices = async (
  userId: number,
  userName: string
): Promise<{ success: boolean; message: string; results?: any[] }> => {
  try {
    const devicesResponse = await getActiveBiometricDevices();
    
    if (!devicesResponse.success || !devicesResponse.data || devicesResponse.data.length === 0) {
      console.warn("No active biometric devices");
      return {
        success: false,
        message: "No active biometric devices found",
      };
    }

    const biometricDeviceId = generateBiometricDeviceId(userId);
    const results: any[] = [];

    console.log(`Adding ${biometricDeviceId} (${userName}) to ${devicesResponse.data.length} device(s)`);

    for (const device of devicesResponse.data) {
      console.log(`Device: ${device.serial_no}`);
      
      const result = await sendEmployeeToBiometricDevice(
        biometricDeviceId,
        userName,
        device.serial_no
      );
      
      results.push({
        deviceId: device.id,
        serialNumber: device.serial_no,
        ...result,
      });

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      message: `Added to ${successCount}/${results.length} device(s)`,
      results,
    };
  } catch (error: any) {
    console.error("Error adding employee:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Delete employee from all active devices
export const deleteEmployeeFromAllDevices = async (
  userId: number
): Promise<{ success: boolean; message: string; results?: any[] }> => {
  try {
    const devicesResponse = await getActiveBiometricDevices();
    
    if (!devicesResponse.success || !devicesResponse.data || devicesResponse.data.length === 0) {
      return {
        success: true,
        message: "No active devices to delete from",
      };
    }

    const biometricDeviceId = generateBiometricDeviceId(userId);
    const results: any[] = [];

    for (const device of devicesResponse.data) {
      const result = await deleteEmployeeFromBiometricDevice(
        biometricDeviceId,
        device.serial_no
      );
      
      results.push({
        deviceId: device.id,
        serialNumber: device.serial_no,
        ...result,
      });

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      message: `Deleted from ${successCount}/${results.length} device(s)`,
      results,
    };
  } catch (error: any) {
    console.error("Error deleting employee:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Update user biometric status - NOW INCLUDES bio_metric_access
export const updateUserBiometricStatus = async (
  userId: number,
  biometricDeviceId: string,
  isActive: boolean = true
) => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        biometric_device_id: biometricDeviceId,
        is_bio_metric_active: isActive,
        bio_metric_access: isActive, // Set bio_metric_access to same value
      })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      message: "Biometric status updated",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Disable biometric for user
export const disableBiometricForUser = async (userId: number) => {
  try {
    // First delete from all devices
    const deleteResult = await deleteEmployeeFromAllDevices(userId);
    
    // Then update database
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        is_bio_metric_active: false,
        bio_metric_access: false,
      })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      message: deleteResult.message + " and database updated",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Create biometric device
export const createBiometricDevice = async (
  serialNo: string,
  deviceName?: string,
  location?: string
) => {
  try {
    const { data, error } = await supabase
      .from("bio_metric")
      .insert([{
        serial_no: serialNo,
        device_name: deviceName || null,
        location: location || null,
        is_active: true,
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      message: "Device created successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Toggle device status
export const toggleBiometricDeviceStatus = async (
  deviceId: number,
  isActive: boolean
) => {
  try {
    const { data, error } = await supabase
      .from("bio_metric")
      .update({ is_active: !isActive })
      .eq("id", deviceId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      message: `Device ${!isActive ? "activated" : "deactivated"}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Delete device
export const deleteBiometricDevice = async (deviceId: number) => {
  try {
    const { error } = await supabase
      .from("bio_metric")
      .delete()
      .eq("id", deviceId);

    if (error) throw error;

    return {
      success: true,
      message: "Device deleted",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};



// Block or unblock user on biometric device
export const blockUnblockUserOnDevice = async (
  employeeCode: string,
  employeeName: string,
  serialNumber: string,
  block: boolean = false
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const payload = {
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

    console.log(`${block ? "Blocking" : "Unblocking"} user on biometric:`, JSON.stringify(payload, null, 2));

    const response = await fetch(BIOMETRIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("Block/Unblock response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }

    return {
      success: response.ok,
      message: response.ok 
        ? `User ${block ? "blocked" : "unblocked"} successfully` 
        : `Error: ${response.status}`,
      data,
    };
  } catch (error: any) {
    console.error("Block/Unblock error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Block user on all active devices - UPDATE DATABASE
export const blockUserOnAllDevices = async (
  userId: number,
  userName: string
): Promise<{ success: boolean; message: string; results?: any[] }> => {
  try {
    const devicesResponse = await getActiveBiometricDevices();
    
    if (!devicesResponse.success || !devicesResponse.data || devicesResponse.data.length === 0) {
      return {
        success: true,
        message: "No active devices to block on",
      };
    }

    const biometricDeviceId = generateBiometricDeviceId(userId);
    const results: any[] = [];

    for (const device of devicesResponse.data) {
      const result = await blockUnblockUserOnDevice(
        biometricDeviceId,
        userName,
        device.serial_no,
        true // block
      );
      
      results.push({
        deviceId: device.id,
        serialNumber: device.serial_no,
        ...result,
      });

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successCount = results.filter(r => r.success).length;

    // UPDATE DATABASE: Set bio_metric_access to false
    if (successCount > 0) {
      await supabase
        .from("user_profiles")
        .update({ bio_metric_access: false })
        .eq("id", userId);
    }

    return {
      success: successCount > 0,
      message: `User blocked on ${successCount}/${results.length} device(s)`,
      results,
    };
  } catch (error: any) {
    console.error("Error blocking user:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Unblock user on all active devices - UPDATE DATABASE
export const unblockUserOnAllDevices = async (
  userId: number,
  userName: string
): Promise<{ success: boolean; message: string; results?: any[] }> => {
  try {
    const devicesResponse = await getActiveBiometricDevices();
    
    if (!devicesResponse.success || !devicesResponse.data || devicesResponse.data.length === 0) {
      return {
        success: true,
        message: "No active devices to unblock on",
      };
    }

    const biometricDeviceId = generateBiometricDeviceId(userId);
    const results: any[] = [];

    for (const device of devicesResponse.data) {
      const result = await blockUnblockUserOnDevice(
        biometricDeviceId,
        userName,
        device.serial_no,
        false // unblock
      );
      
      results.push({
        deviceId: device.id,
        serialNumber: device.serial_no,
        ...result,
      });

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successCount = results.filter(r => r.success).length;

    // UPDATE DATABASE: Set bio_metric_access to true
    if (successCount > 0) {
      await supabase
        .from("user_profiles")
        .update({ bio_metric_access: true })
        .eq("id", userId);
    }

    return {
      success: successCount > 0,
      message: `User unblocked on ${successCount}/${results.length} device(s)`,
      results,
    };
  } catch (error: any) {
    console.error("Error unblocking user:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};


// Sync user block status based on subscription
export const syncUserBlockStatus = async (userId: number) => {
  try {
    // Get user details
    const { data: user, error: userError } = await supabase
      .from("user_profiles")
      .select("id, name, subscription_status, biometric_device_id, is_bio_metric_active")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new Error("User not found");
    }

    // If user doesn't have biometric setup, skip
    if (!user.is_bio_metric_active || !user.biometric_device_id) {
      return {
        success: true,
        message: "User doesn't have biometric access",
      };
    }

    // Block if subscription is inactive, unblock if active
    if (user.subscription_status) {
      // Unblock user
      const result = await unblockUserOnAllDevices(user.id, user.name);
      return result;
    } else {
      // Block user
      const result = await blockUserOnAllDevices(user.id, user.name);
      return result;
    }
  } catch (error: any) {
    console.error("Error syncing block status:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Get all users with active subscriptions (for re-enrollment list)
export const getAllUsersWithActiveSubscriptions = async () => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, name, email, biometric_device_id, is_bio_metric_active, bio_metric_access, profile_image, clerk_url, contact_no, subscription_status")
      .eq("subscription_status", true)
      .order("name", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data as BiometricUser[],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Re-enroll user (add to biometric devices)
export const reEnrollUser = async (
  userId: number,
  userName: string
): Promise<{ success: boolean; message: string; results?: any[] }> => {
  try {
    // Generate or get existing biometric device ID
    let biometricDeviceId = "";
    
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("biometric_device_id")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    // If user already has a device ID, use it; otherwise generate new one
    if (userData.biometric_device_id) {
      biometricDeviceId = userData.biometric_device_id;
    } else {
      biometricDeviceId = generateBiometricDeviceId(userId);
    }

    // Add employee to all active devices
    const result = await addEmployeeToAllDevices(userId, userName);

    if (result.success) {
      // Update user biometric status
      await updateUserBiometricStatus(userId, biometricDeviceId, true);
    }

    return result;
  } catch (error: any) {
    console.error("Error re-enrolling user:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};


// Auto-handle biometric access on subscription purchase/renewal
export const handleBiometricOnSubscriptionPurchase = async (
  userId: number,
  userName: string
): Promise<{ success: boolean; message: string; action: 'unblocked' | 'enrolled' | 'skipped' }> => {
  try {
    console.log(`🔄 Handling biometric for user ${userId} (${userName}) after subscription purchase`);

    // Get user's current biometric status
    const { data: user, error: userError } = await supabase
      .from("user_profiles")
      .select("id, name, is_bio_metric_active, biometric_device_id, bio_metric_access")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      throw userError;
    }

    // Case 1: User already has biometric setup and is active
    if (user.is_bio_metric_active && user.biometric_device_id) {
      console.log(`✅ User ${userName} has active biometric - checking access status`);

      // If currently blocked, unblock them
      if (!user.bio_metric_access) {
        console.log(`🔓 Unblocking user ${userName} after subscription purchase`);
        const unblockResult = await unblockUserOnAllDevices(userId, userName);
        
        if (unblockResult.success) {
          return {
            success: true,
            message: `User ${userName} unblocked successfully on all devices`,
            action: 'unblocked',
          };
        } else {
          return {
            success: false,
            message: `Failed to unblock user: ${unblockResult.message}`,
            action: 'unblocked',
          };
        }
      } else {
        console.log(`✓ User ${userName} already has biometric access - no action needed`);
        return {
          success: true,
          message: `User ${userName} already has active biometric access`,
          action: 'skipped',
        };
      }
    }
    // Case 2: User doesn't have biometric setup - enroll them
    else {
      console.log(`➕ User ${userName} doesn't have biometric - enrolling now`);
      
      const biometricDeviceId = user.biometric_device_id || generateBiometricDeviceId(userId);
      const enrollResult = await addEmployeeToAllDevices(userId, userName);
      
      if (enrollResult.success) {
        // Update database with biometric status
        await updateUserBiometricStatus(userId, biometricDeviceId, true);
        
        return {
          success: true,
          message: `User ${userName} enrolled successfully on ${enrollResult.results?.length || 0} device(s)`,
          action: 'enrolled',
        };
      } else {
        return {
          success: false,
          message: `Failed to enroll user: ${enrollResult.message}`,
          action: 'enrolled',
        };
      }
    }
  } catch (error: any) {
    console.error("Error handling biometric on subscription purchase:", error);
    return {
      success: false,
      message: error.message || "Failed to handle biometric access",
      action: 'skipped',
    };
  }
};