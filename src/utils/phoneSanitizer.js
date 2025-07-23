
const sanitizePhone = (phoneNumber)=>{
    if (!phoneNumber) return null;
    
    // Remove all non-digit characters
    const sanitized = phoneNumber.replace(/\D/g, '');

    // Check if the sanitized number is valid (12 digits)
    if (sanitized.startsWith('+52') && sanitized.length === 12) {
        return `+${sanitized}`;
    } 
    if(sanitized.length === 10) {
        return `+52${sanitized}`;
    }
    return null;
}

module.exports = sanitizePhone;