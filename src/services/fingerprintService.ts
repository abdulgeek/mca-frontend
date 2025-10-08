import { FingerprintData } from '../types';

/**
 * Fingerprint Service using WebAuthn API
 * Handles browser-based biometric authentication
 */

export class FingerprintService {
  private static rpName = 'Attendance System';
  private static rpID = window.location.hostname;

  /**
   * Check if WebAuthn is supported in the browser
   */
  static isSupported(): boolean {
    return !!(
      window.PublicKeyCredential &&
      navigator.credentials &&
      typeof navigator.credentials.create === 'function' &&
      typeof navigator.credentials.get === 'function'
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
      console.error('Error checking platform authenticator:', error);
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
    let binary = '';
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
      throw new Error('WebAuthn is not supported in this browser');
    }

    const isAvailable = await this.isPlatformAuthenticatorAvailable();
    if (!isAvailable) {
      throw new Error(
        'Fingerprint authentication is not available on this device. Please use face recognition instead.'
      );
    }

    try {
      const challenge = this.generateChallenge();
      const userId = this.generateUserId();

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
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
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          requireResidentKey: false,
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
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
      console.error('Fingerprint enrollment error:', error);
      
      if (error.name === 'NotAllowedError') {
        throw new Error('Fingerprint registration was cancelled or timed out');
      } else if (error.name === 'InvalidStateError') {
        throw new Error('This fingerprint is already registered');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Fingerprint authentication is not supported on this device');
      }
      
      throw new Error(
        error.message || 'Failed to register fingerprint. Please try again.'
      );
    }
  }

  /**
   * Authenticate using fingerprint for attendance
   * @returns FingerprintData with authentication assertion
   */
  static async authenticateFingerprint(): Promise<FingerprintData> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const isAvailable = await this.isPlatformAuthenticatorAvailable();
    if (!isAvailable) {
      throw new Error(
        'Fingerprint authentication is not available on this device'
      );
    }

    try {
      const challenge = this.generateChallenge();

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        rpId: this.rpID,
      };

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('Failed to get credential');
      }

      const response = assertion.response as AuthenticatorAssertionResponse;

      // Extract assertion data
      const credentialId = this.arrayBufferToBase64(assertion.rawId);
      const authenticatorData = this.arrayBufferToBase64(response.authenticatorData);
      const clientDataJSON = this.arrayBufferToBase64(response.clientDataJSON);
      const signature = this.arrayBufferToBase64(response.signature);
      const userHandle = response.userHandle
        ? this.arrayBufferToBase64(response.userHandle)
        : undefined;

      return {
        credentialId,
        publicKey: '', // Not needed for authentication
        counter: 0,
        authenticatorData,
        clientDataJSON,
        signature,
        userHandle,
      };
    } catch (error: any) {
      console.error('Fingerprint authentication error:', error);
      
      if (error.name === 'NotAllowedError') {
        throw new Error('Fingerprint authentication was cancelled or timed out');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No registered fingerprint found. Please enroll first.');
      }
      
      throw new Error(
        error.message || 'Fingerprint authentication failed. Please try again.'
      );
    }
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(error: any): string {
    if (error.name === 'NotAllowedError') {
      return 'Permission denied. Please allow fingerprint access.';
    } else if (error.name === 'NotSupportedError') {
      return 'Fingerprint authentication is not supported on this device.';
    } else if (error.name === 'InvalidStateError') {
      return 'Fingerprint already registered or invalid state.';
    } else if (error.name === 'NotFoundError') {
      return 'No fingerprint registered. Please enroll first.';
    } else if (error.name === 'SecurityError') {
      return 'Security error. Please ensure you are on a secure connection (HTTPS).';
    }
    
    return error.message || 'An error occurred during fingerprint authentication.';
  }
}

export default FingerprintService;

