export const AZURE_CONFIG = {
    issuer: 'https://login.microsoftonline.com/db01513b-9352-48dc-9232-8fc9f4e6979f/v2.0',
    clientId: '386c866e-eeb8-48c2-841a-9d8dfe88606f',
    redirectUrl: 'msauth://com.ipromobile/nnn0WWoQYCkTg458G2kpbpmZmLY=',
    scopes: ['api://386c866e-eeb8-48c2-841a-9d8dfe88606f/access_as_user']  // Requests all permissions your app has consented to
};

export const API_CONFIG = {
    BASE_URL: 'https://iprolocal-uat.ideassionlive.in/api',
};

export const WORK_LOCATIONS = [
    { id: 'OFFICE', label: 'Office', icon: 'office-building' },
    { id: 'WFH', label: 'Home', icon: 'home' },
    { id: 'CLIENT', label: 'Client', icon: 'account-group' },
];

export const OFFICE_LOCATION = {
    LATITUDE: 13.057018116345612,
    LONGITUDE: 80.25718253777461,
    RADIUS: 150, // in meters
    CITY: 'Chennai', // Used in attendance & regularization API payloads
};

// Default shift displayed on the dashboard when the API does not return shift info
export const DEFAULT_SHIFT = {
    name: 'General',
    timing: '10:00 AM - 7:00 PM',
};
