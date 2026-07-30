import { LoginDeviceInfo } from "../types/dtos";
import { Request } from "express";
import axios from "axios";



export const parseDeviceInfo = (userAgent: string): string =>{
    // Simple device detection (you can use a library like 'ua-parser-js' for better detection)
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return 'Mobile Device';
    } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  }

export const extractDeviceName = (deviceInfo: string): string => {
    // Extract OS
    let os = '';
    if (deviceInfo.includes('iPhone')) {
      os = 'iOS';
    } else if (deviceInfo.includes('iPad')) {
      os = 'iPadOS';
    } else if (deviceInfo.includes('Android')) {
      os = 'Android';
    } else if (deviceInfo.includes('Macintosh') || deviceInfo.includes('Mac OS X')) {
      os = 'macOS';
    } else if (deviceInfo.includes('Windows')) {
      os = 'Windows';
    } else if (deviceInfo.includes('Linux')) {
      os = 'Linux';
    }
    
    // Extract Browser
    let browser = '';
    if (deviceInfo.includes('Chrome') && !deviceInfo.includes('Edg')) {
      browser = 'Chrome Browser';
    } else if (deviceInfo.includes('Safari') && !deviceInfo.includes('Chrome')) {
      browser = 'Safari Browser';
    } else if (deviceInfo.includes('Firefox')) {
      browser = 'Firefox Browser';
    } else if (deviceInfo.includes('Edg')) {
      browser = 'Edge Browser';
    } else if (deviceInfo.includes('Opera')) {
      browser = 'Opera Browser';
    }
    
    // Combine OS and Browser
    if (os && browser) {
      return `${os} - ${browser}`;
    } else if (os) {
      return `${os} Device`;
    } else if (browser) {
      return browser;
    } else if (deviceInfo.includes('Mobile')) {
      return 'Mobile Device';
    } else {
      return 'Unknown Device';
    }
  }


export const extractDeviceInfo = async (req: Request): Promise<LoginDeviceInfo> => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress;

    // Get actual IP address, but provide better fallback for development
    const cleanIp =
      ip === "::1" || ip?.startsWith("127.") || ip?.startsWith("::ffff:")
        ? req.headers["x-real-ip"] as string || req.headers["x-client-ip"] as string || "127.0.0.1" // better fallback for development
        : ip;

    const userAgent = req.get('User-Agent') || '';
    
    // Use the more detailed device name extraction instead of generic parsing
    const deviceName = extractDeviceName(userAgent);

    // Fetch location from a geolocation API
    try {
      // Skip geolocation for localhost/development IPs
      if (cleanIp === "127.0.0.1" || cleanIp?.startsWith("192.168.") || cleanIp?.startsWith("10.") || cleanIp?.startsWith("172.")) {
        return {
          userAgent: userAgent,
          ipAddress: cleanIp,
          deviceInfo: deviceName,
          location: 'Local Development'
        };
      }

      let locationStr = 'Unknown Location';
      try {
        const geoRes = await axios.get(`http://ip-api.com/json/${cleanIp}`);
        if (geoRes.data && geoRes.data.status === 'success') {
          locationStr = `${geoRes.data.city || 'Unknown City'}, ${geoRes.data.regionName || ''}, ${geoRes.data.country || ''}`.replace(/,\s*,/g, ',');
        } else {
          // Fallback to ipwho.is
          const fallbackRes = await axios.get(`https://ipwho.is/${cleanIp}`);
          if (fallbackRes.data && fallbackRes.data.success) {
            locationStr = `${fallbackRes.data.city || 'Unknown City'}, ${fallbackRes.data.region || ''}, ${fallbackRes.data.country || ''}`.replace(/,\s*,/g, ',');
          }
        }
      } catch (apiError) {
        // Just keep 'Unknown Location' on API failure
      }

      return {
        userAgent: userAgent,
        ipAddress: cleanIp,
        deviceInfo: deviceName,
        location: locationStr
      };
    } catch (error) {
      return {
        userAgent: userAgent,
        ipAddress: cleanIp,
        deviceInfo: deviceName,
        location: 'Unknown Location'
      };
    }
}