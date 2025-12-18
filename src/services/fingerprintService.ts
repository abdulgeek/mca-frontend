import {
  FingerprintData,
  ExternalFingerprintData,
  SensorInfo,
  SensorEvent,
} from "../types";
import { apiService } from "./api";

/**
 * Fingerprint Service using WebAuthn API
 * Handles browser-based biometric authentication
 */

export class FingerprintService {
  private static rpName = "Attendance System";
  private static rpID = window.location.hostname;

  /**
   * Check if WebAuthn is supported in the browser
   */
  static isSupported(): boolean {
    return !!(
      window.PublicKeyCredential &&
      navigator.credentials &&
      typeof navigator.credentials.create === "function" &&
      typeof navigator.credentials.get === "function"
    );
  }

  /**
   * Check if platform authenticator (like fingerprint) is available
   */
  static async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.error("Error checking platform authenticator:", error);
      return false;
    }
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Generate random challenge
   */
  private static generateChallenge(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32));
  }

  /**
   * Generate random user ID
   */
  private static generateUserId(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Register a new fingerprint credential during enrollment
   * @param userName - User's name
   * @param userEmail - User's email
   * @returns FingerprintData containing credential info
   */
  static async enrollFingerprint(
    userName: string,
    userEmail: string
  ): Promise<FingerprintData> {
    if (!this.isSupported()) {
      throw new Error("WebAuthn is not supported in this browser");
    }

    const isAvailable = await this.isPlatformAuthenticatorAvailable();
    if (!isAvailable) {
      throw new Error(
        "Fingerprint authentication is not available on this device. Please use face recognition instead."
      );
    }

    try {
      const challenge = this.generateChallenge();
      const userId = this.generateUserId();

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
        {
          challenge,
          rp: {
            name: this.rpName,
            id: this.rpID,
          },
          user: {
            id: userId,
            name: userEmail,
            displayName: userName,
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            requireResidentKey: false,
            userVerification: "required",
          },
          timeout: 60000,
          attestation: "none",
        };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to create credential");
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Extract credential data
      const credentialId = this.arrayBufferToBase64(credential.rawId);
      const publicKey = this.arrayBufferToBase64(response.getPublicKey()!);

      return {
        credentialId,
        publicKey,
        counter: 0,
      };
    } catch (error: any) {
      console.error("Fingerprint enrollment error:", error);

      if (error.name === "NotAllowedError") {
        throw new Error("Fingerprint registration was cancelled or timed out");
      } else if (error.name === "InvalidStateError") {
        throw new Error("This fingerprint is already registered");
      } else if (error.name === "NotSupportedError") {
        throw new Error(
          "Fingerprint authentication is not supported on this device"
        );
      }

      throw new Error(
        error.message || "Failed to register fingerprint. Please try again."
      );
    }
  }

  /**
   * Authenticate using fingerprint for attendance
   * @returns FingerprintData with authentication assertion
   */
  static async authenticateFingerprint(): Promise<FingerprintData> {
    if (!this.isSupported()) {
      throw new Error("WebAuthn is not supported in this browser");
    }

    const isAvailable = await this.isPlatformAuthenticatorAvailable();
    if (!isAvailable) {
      throw new Error(
        "Fingerprint authentication is not available on this device"
      );
    }

    try {
      const challenge = this.generateChallenge();

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
        {
          challenge,
          timeout: 60000,
          userVerification: "required",
          rpId: this.rpID,
        };

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      if (!assertion) {
        throw new Error("Failed to get credential");
      }

      const response = assertion.response as AuthenticatorAssertionResponse;

      // Extract assertion data
      const credentialId = this.arrayBufferToBase64(assertion.rawId);
      const authenticatorData = this.arrayBufferToBase64(
        response.authenticatorData
      );
      const clientDataJSON = this.arrayBufferToBase64(response.clientDataJSON);
      const signature = this.arrayBufferToBase64(response.signature);
      const userHandle = response.userHandle
        ? this.arrayBufferToBase64(response.userHandle)
        : undefined;

      return {
        credentialId,
        publicKey: "", // Not needed for authentication
        counter: 0,
        authenticatorData,
        clientDataJSON,
        signature,
        userHandle,
      };
    } catch (error: any) {
      console.error("Fingerprint authentication error:", error);

      if (error.name === "NotAllowedError") {
        throw new Error(
          "Fingerprint authentication was cancelled or timed out"
        );
      } else if (error.name === "NotFoundError") {
        throw new Error(
          "No registered fingerprint found. Please enroll first."
        );
      }

      throw new Error(
        error.message || "Fingerprint authentication failed. Please try again."
      );
    }
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(error: any): string {
    if (error.name === "NotAllowedError") {
      return "Permission denied. Please allow fingerprint access.";
    } else if (error.name === "NotSupportedError") {
      return "Fingerprint authentication is not supported on this device.";
    } else if (error.name === "InvalidStateError") {
      return "Fingerprint already registered or invalid state.";
    } else if (error.name === "NotFoundError") {
      return "No fingerprint registered. Please enroll first.";
    } else if (error.name === "SecurityError") {
      return "Security error. Please ensure you are on a secure connection (HTTPS).";
    }

    return (
      error.message || "An error occurred during fingerprint authentication."
    );
  }

  // ===== EXTERNAL SENSOR METHODS =====

  private static sseConnection: EventSource | null = null;
  private static currentMode: "external_sensor" | "webauthn" | "auto" = "auto";
  private static captureCallbacks: Map<string, Function> = new Map();

  /**
   * Check if external sensors are available
   */
  static async hasExternalSensors(): Promise<boolean> {
    try {
      const response = await apiService.api.get("/sensors/enumerate");
      return response.data.sensors && response.data.sensors.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Connect to SSE stream for real-time sensor updates
   */
  static connectToSSE(
    onEvent: (event: SensorEvent) => void
  ): EventSource | null {
    try {
      const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5001";
      this.sseConnection = new EventSource(`${baseURL}/sensors/events`);

      this.sseConnection.onmessage = (e) => {
        try {
          const eventData = JSON.parse(e.data);
          onEvent(eventData);
        } catch (error) {
          console.error("Error parsing SSE event:", error);
        }
      };

      this.sseConnection.onerror = (error) => {
        console.error("SSE connection error:", error);
        this.disconnectSSE();
      };

      this.sseConnection.onopen = () => {
        console.log("SSE connection established");
      };

      return this.sseConnection;
    } catch (error) {
      console.error("Failed to connect to SSE:", error);
      return null;
    }
  }

  /**
   * Disconnect from SSE stream
   */
  static disconnectSSE(): void {
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
    }
  }

  /**
   * Enumerate connected sensors
   */
  static async enumerateSensors(): Promise<SensorInfo[]> {
    try {
      const response = await apiService.api.get("/sensors/enumerate");
      return response.data.sensors || [];
    } catch (error) {
      console.error("Error enumerating sensors:", error);
      return [];
    }
  }

  /**
   * Get sensor health status
   */
  static async getSensorHealthStatus(): Promise<{
    isHealthy: boolean;
    sensorCount: number;
    connectedCount: number;
    errors: string[];
  }> {
    try {
      const response = await apiService.api.get("/fingerprint/sensors/health");
      return response.data;
    } catch (error) {
      console.error("Error getting sensor health:", error);
      return {
        isHealthy: false,
        sensorCount: 0,
        connectedCount: 0,
        errors: ["Failed to connect to sensor service"],
      };
    }
  }

  /**
   * Capture fingerprint from external sensor
   */
  static async captureFromExternalSensor(
    sensorId: string,
    options?: {
      timeout?: number;
      quality?: number;
      maxRetries?: number;
      captureMode?: "enrollment" | "verification";
    }
  ): Promise<ExternalFingerprintData> {
    try {
      const response = await apiService.api.post("/sensors/capture", {
        sensorId,
        options: {
          timeout: options?.timeout || 30000,
          quality: options?.quality || 70,
          maxRetries: options?.maxRetries || 3,
          captureMode: options?.captureMode || "verification",
        },
      });

      // The API returns data nested under response.data.data
      const templateData = response.data.data || response.data;

      console.log("📡 Capture Response:", {
        fullResponse: response.data,
        templateData,
        quality: templateData.quality,
        hasQuality: "quality" in templateData,
      });

      return {
        template: templateData.template,
        quality: templateData.quality || 100, // Default to 100 if not provided
        sensorId: templateData.sensorId,
        sensorType: templateData.sensorType as any,
        capturedAt: new Date(templateData.capturedAt),
        metadata: templateData.metadata,
      };
    } catch (error: any) {
      console.error("Error capturing from external sensor:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to capture fingerprint from sensor"
      );
    }
  }

  /**
   * Enroll external fingerprint for a student
   */
  static async enrollExternalFingerprint(
    studentId: string,
    externalFingerprintData: ExternalFingerprintData
  ): Promise<void> {
    try {
      await apiService.api.post("/fingerprint/sensors/enroll", {
        studentId,
        externalFingerprintData,
      });
    } catch (error: any) {
      console.error("Error enrolling external fingerprint:", error);
      throw new Error(
        error.response?.data?.message || "Failed to enroll external fingerprint"
      );
    }
  }

  /**
   * Auto-detect best fingerprint method available
   */
  static async getBestFingerprintMethod(): Promise<
    "external_sensor" | "webauthn" | "none"
  > {
    // Check for external sensors first (preferred)
    const hasExternalSensors = await this.hasExternalSensors();
    if (hasExternalSensors) {
      return "external_sensor";
    }

    // Fall back to WebAuthn if supported
    const isWebAuthnAvailable = await this.isPlatformAuthenticatorAvailable();
    if (isWebAuthnAvailable) {
      return "webauthn";
    }

    return "none";
  }

  /**
   * Mark attendance using the best available fingerprint method
   */
  static async markAttendanceWithBestMethod(
    location?: string,
    notes?: string,
    action?: "auto" | "login" | "logout",
    preferredMethod?: "external_sensor" | "webauthn"
  ): Promise<any> {
    const method = preferredMethod || (await this.getBestFingerprintMethod());

    if (method === "none") {
      throw new Error("No fingerprint authentication method available");
    }

    if (method === "external_sensor") {
      // Get available sensors
      const sensors = await this.enumerateSensors();
      if (sensors.length === 0) {
        throw new Error("No external sensors available");
      }

      // Use the first available sensor (could be enhanced to let user choose)
      const sensor = sensors[0];
      const fingerprintData = await this.captureFromExternalSensor(sensor.id, {
        captureMode: "verification",
      });

      // Mark attendance with external sensor data
      return await apiService.api.post("/fingerprint/mark-attendance", {
        fingerprintData,
        fingerprintMode: "external",
        location,
        notes,
        action,
      });
    } else {
      // Use WebAuthn
      const fingerprintData = await this.authenticateFingerprint();

      return await apiService.api.post("/fingerprint/mark-attendance", {
        fingerprintData,
        fingerprintMode: "webauthn",
        location,
        notes,
        action,
      });
    }
  }

  /**
   * Check login status using fingerprint
   */
  static async checkLoginStatusWithFingerprint(
    preferredMethod?: "external_sensor" | "webauthn"
  ): Promise<any> {
    const method = preferredMethod || (await this.getBestFingerprintMethod());

    if (method === "none") {
      throw new Error("No fingerprint authentication method available");
    }

    if (method === "external_sensor") {
      // Get available sensors
      const sensors = await this.enumerateSensors();
      if (sensors.length === 0) {
        throw new Error("No external sensors available");
      }

      const sensor = sensors[0];
      const fingerprintData = await this.captureFromExternalSensor(sensor.id, {
        captureMode: "verification",
      });

      return await apiService.api.post("/fingerprint/check-status", {
        fingerprintData,
        fingerprintMode: "external",
      });
    } else {
      const fingerprintData = await this.authenticateFingerprint();

      return await apiService.api.post("/fingerprint/check-status", {
        fingerprintData,
        fingerprintMode: "webauthn",
      });
    }
  }

  /**
   * Get current fingerprint mode
   */
  static getCurrentMode(): "external_sensor" | "webauthn" | "auto" {
    return this.currentMode;
  }

  /**
   * Set fingerprint mode
   */
  static setMode(mode: "external_sensor" | "webauthn" | "auto"): void {
    this.currentMode = mode;
  }
}

export default FingerprintService;
