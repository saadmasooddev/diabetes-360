import { type Request, type Response, type NextFunction } from "express";

export function mobileResponse(req: Request, res: Response, next: NextFunction): void {
    if (!req.path.startsWith('/api')) return next();
  
    const isMobile = req.headers['ismobile'] || req.headers['isMobile'];
  
    if (!isMobile || (typeof isMobile === 'string' && isMobile.toLowerCase() !== 'true')) {
      return next();
    }
  
    let responseStatus = 200;
  
    const originalStatus = res.status;
    res.status = function (code) {
      responseStatus = code;
      return originalStatus.call(this, code);
    };
  
    const originalJson = res.json;
    res.json = function (data) {
      let message = '';
      let status = responseStatus;
      let wrappedData;
  
      console.log("The data is", data);
      if (data && typeof data === 'object' && 'message' in data && Object.keys(data).length === 1) {
        message = data.message || data.error || '';
        console.log("The message is 2", message, data.message, data.error)
        wrappedData = Array.isArray(data) ? [] : null;
      } else {
        if (data && typeof data === 'object' && 'message' in data) {
          message = data.message || data.error || '';
          console.log("The message is 1", message)
          const { message: _msg, ...rest } = data;
          data = rest;
        }
      
        if (Array.isArray(data)) {
          wrappedData = data;
        } else if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          wrappedData = data;
        } else if (Array.isArray(data)) {
          wrappedData = [];
        } else {
          wrappedData = null;
        }
      }
  
      console.log("The message is", message)
      return originalJson.call(this, {
        message,
        status,
        data: wrappedData,
      });
    };
  
    next();
  }