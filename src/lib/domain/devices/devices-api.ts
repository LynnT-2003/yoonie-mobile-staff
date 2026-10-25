import { postRequest, deleteRequest } from "../api/NetworkManager";
import { RegisterDeviceDto, DeviceResponseDto } from "../../types";

export const devicesApi = {
  async registerDevice(dto: RegisterDeviceDto): Promise<DeviceResponseDto> {
    return postRequest<DeviceResponseDto, RegisterDeviceDto>("/devices", dto);
  },

  async unregisterDevice(deviceId: string): Promise<void> {
    return deleteRequest<void>(`/devices/${deviceId}`);
  },
};
