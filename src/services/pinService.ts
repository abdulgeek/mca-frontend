import { apiService } from './api';

const PIN_AUTHENTICATED_KEY = 'pin_authenticated';

/**
 * PIN Service
 * Manages PIN validation and authentication state
 */
class PinService {
  /**
   * Validates PIN with backend API
   * @param pin - 4-digit PIN string
   * @returns Promise<boolean> - true if PIN is valid, false otherwise
   */
  async validatePin(pin: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate format first
      if (!/^\d{4}$/.test(pin)) {
        return {
          success: false,
          message: 'PIN must be exactly 4 digits'
        };
      }

      // Call backend API
      const response = await apiService.validatePin(pin);
      
      if (response.success) {
        // Store authentication state in localStorage
        this.setAuthenticated(true);
        return {
          success: true,
          message: 'PIN validated successfully'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Invalid PIN'
        };
      }
    } catch (error: any) {
      console.error('PIN validation error:', error);
      return {
        success: false,
        message: error.message || 'Failed to validate PIN. Please try again.'
      };
    }
  }

  /**
   * Check if user is authenticated
   * @returns boolean - true if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    try {
      const authState = localStorage.getItem(PIN_AUTHENTICATED_KEY);
      return authState === 'true';
    } catch (error) {
      console.error('Error reading authentication state:', error);
      return false;
    }
  }

  /**
   * Set authentication state
   * @param authenticated - authentication state
   */
  setAuthenticated(authenticated: boolean): void {
    try {
      if (authenticated) {
        localStorage.setItem(PIN_AUTHENTICATED_KEY, 'true');
      } else {
        localStorage.removeItem(PIN_AUTHENTICATED_KEY);
      }
    } catch (error) {
      console.error('Error setting authentication state:', error);
    }
  }

  /**
   * Logout - clear authentication state
   */
  logout(): void {
    this.setAuthenticated(false);
  }
}

export const pinService = new PinService();
export default pinService;

