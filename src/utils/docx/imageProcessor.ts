export const processBase64Image = async (base64String: string): Promise<Buffer> => {
  try {
    // Handle both data URL and raw base64
    let base64Data = base64String;
    
    // If it's a data URL, extract the base64 part
    if (base64String.includes('base64,')) {
      base64Data = base64String.split('base64,')[1];
    }
    
    // Convert base64 to Buffer
    return Buffer.from(base64Data, 'base64');
  } catch (error) {
    console.error('Error processing base64 image:', error);
    throw new Error('Failed to process image');
  }
};

export const isValidBase64Image = (str: string): boolean => {
  if (!str) return false;
  
  try {
    // Check if it's a data URL
    if (str.startsWith('data:image')) {
      return true;
    }
    
    // Check if it's raw base64
    const base64Regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
    return base64Regex.test(str);
  } catch {
    return false;
  }
};