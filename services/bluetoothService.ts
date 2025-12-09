// UUIDs for the Service and Characteristic
// In a real scenario, these would match your specific hardware (Arduino, ESP32, etc.)
// Using a custom generated 128-bit UUID for the Game Service
export const GAME_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
export const MOVE_CHARACTERISTIC_UUID = '87654321-4321-4321-4321-cba987654321';

// Interface for Web Bluetooth types (simplified as they are experimental in some TS configs)
interface BluetoothDevice {
  gatt?: BluetoothRemoteGATTServer;
  name?: string;
  addEventListener: (type: string, listener: (event: Event) => void) => void;
  removeEventListener: (type: string, listener: (event: Event) => void) => void;
}

interface BluetoothRemoteGATTServer {
  connect: () => Promise<BluetoothRemoteGATTServer>;
  disconnect: () => void;
  getPrimaryService: (uuid: string) => Promise<BluetoothRemoteGATTService>;
  connected: boolean;
}

interface BluetoothRemoteGATTService {
  getCharacteristic: (uuid: string) => Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
  writeValue: (value: BufferSource) => Promise<void>;
  startNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener: (type: string, listener: (event: Event) => void) => void;
  removeEventListener: (type: string, listener: (event: Event) => void) => void;
  value?: DataView;
}

// Extend Navigator interface
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice: (options: any) => Promise<BluetoothDevice>;
    };
  }
}

class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onMoveReceived: ((index: number) => void) | null = null;
  private onDisconnect: (() => void) | null = null;

  isSupported(): boolean {
    return !!navigator.bluetooth;
  }

  async connect(onDisconnect: () => void): Promise<string> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser.');
    }

    try {
      this.device = await navigator.bluetooth!.requestDevice({
        filters: [{ services: [GAME_SERVICE_UUID] }],
        optionalServices: [GAME_SERVICE_UUID]
      });

      if (!this.device || !this.device.gatt) {
        throw new Error('Device not found or does not support GATT.');
      }

      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect);
      this.onDisconnect = onDisconnect;

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(GAME_SERVICE_UUID);
      this.characteristic = await service.getCharacteristic(MOVE_CHARACTERISTIC_UUID);

      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged', this.handleCharacteristicValueChanged);

      return this.device.name || 'Unknown Device';
    } catch (error: any) {
      console.error('Bluetooth Connection Error:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.device) {
      this.device.removeEventListener('gattserverdisconnected', this.handleDisconnect);
    }
    if (this.characteristic) {
      this.characteristic.removeEventListener('characteristicvaluechanged', this.handleCharacteristicValueChanged);
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.onMoveReceived = null;
    this.onDisconnect = null;
  }

  private handleDisconnect = () => {
    console.log('Device disconnected');
    if (this.onDisconnect) {
      this.onDisconnect();
    }
    this.cleanup();
  };

  private handleCharacteristicValueChanged = (event: Event) => {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    if (target.value) {
      // Expecting a single byte Uint8 representing the index 0-8
      const index = target.value.getUint8(0);
      if (this.onMoveReceived) {
        this.onMoveReceived(index);
      }
    }
  };

  setMoveHandler(handler: (index: number) => void) {
    this.onMoveReceived = handler;
  }

  async sendMove(index: number) {
    if (!this.characteristic) return;
    const data = new Uint8Array([index]);
    try {
      await this.characteristic.writeValue(data);
    } catch (e) {
      console.error("Failed to send move", e);
    }
  }
}

export const bluetoothService = new BluetoothService();