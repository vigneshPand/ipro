import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import apiClient from '../api/client';

/**
 * Service to handle leave attachment operations (view and download)
 * Supports both iOS and Android platforms
 */
class LeaveAttachmentService {
  /**
   * Convert ArrayBuffer to Base64 string
   * @param {ArrayBuffer} buffer - Binary buffer
   * @returns {string} Base64 encoded string
   */
  static arrayBufferToBase64(buffer) {
    if (!buffer) {
      return '';
    }
    // React Native provides a Buffer polyfill via metro; convert directly to base64
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return Buffer.from(bytes).toString('base64');
  }

  /**
   * Sanitize file name by removing special characters
   * @param {string} fileName - Original file name
   * @returns {string} Cleaned file name
   */
  static sanitizeFileName(fileName) {
    if (!fileName) {
      return 'attachment';
    }
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  /**
   * View attachment by downloading and displaying it
   * @param {string} requestId - Leave request ID
   * @param {number} attachmentIndex - Index of attachment to view
   * @returns {Promise<string>} Base64 encoded image data
   * @throws {Error} If fetch fails
   */
  static async viewAttachment(requestId, attachmentIndex) {
    if (!requestId) {
      throw new Error('Unable to retrieve request ID');
    }

    try {
      const response = await apiClient.get('/leave/viewAttachment', {
        params: {
          requestId,
          attachmentIndex,
        },
        responseType: 'arraybuffer',
      });

      if (!response.data) {
        throw new Error('No attachment data received');
      }

      const base64Image = this.arrayBufferToBase64(response.data);
      return base64Image;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load attachment';
      throw new Error(errorMessage);
    }
  }

  /**
   * Download attachment to device storage
   * Handles both iOS and Android platforms appropriately
   * @param {string} requestId - Leave request ID
   * @param {number} attachmentIndex - Index of attachment to download
   * @param {string} fileName - Original file name
   * @returns {Promise<Object>} Download result with path and file name
   * @throws {Error} If download fails
   */
  static async downloadAttachment(requestId, attachmentIndex, fileName) {
    if (!requestId) {
      throw new Error('Unable to retrieve request ID');
    }

    try {
      const response = await apiClient.get('/leave/downloadAttachment', {
        params: {
          requestId,
          attachmentIndex,
        },
        responseType: 'arraybuffer',
      });

      if (!response.data) {
        throw new Error('No file data received');
      }

      const base64Data = this.arrayBufferToBase64(response.data);
      const cleanFileName = this.sanitizeFileName(
        fileName || `attachment_${attachmentIndex}`
      );

      // Determine download directory based on platform
      const downloadDir =
        Platform.OS === 'ios'
          ? `${RNFS.DocumentDirectoryPath}/Downloads`
          : RNFS.DownloadDirectoryPath;

      // Ensure iOS downloads directory exists
      if (Platform.OS === 'ios') {
        const exists = await RNFS.exists(downloadDir);
        if (!exists) {
          await RNFS.mkdir(downloadDir);
        }
      }

      // Full file path
      const filePath = `${downloadDir}/${cleanFileName}`;

      // Save file
      await RNFS.writeFile(filePath, base64Data, 'base64');

      return {
        success: true,
        path: filePath,
        fileName: cleanFileName,
        message: `File saved to ${Platform.OS === 'ios' ? 'Device' : 'Downloads'} folder`,
      };
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to download attachment';
      throw new Error(errorMessage);
    }
  }
}

export default LeaveAttachmentService;
