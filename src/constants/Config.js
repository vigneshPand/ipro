export const AZURE_CONFIG = {
    issuer: 'https://login.microsoftonline.com/db01513b-9352-48dc-9232-8fc9f4e6979f/v2.0',
    clientId: '386c866e-eeb8-48c2-841a-9d8dfe88606f',
    redirectUrl: 'msauth://com.ipromobile/nnn0WWoQYCkTg458G2kpbpmZmLY=',
    scopes: ['openid', 'profile', 'email', 'User.Read'],
};

export const API_CONFIG = {
    BASE_URL: 'https://ems-ma.ideassionlive.in/api',
};

export const WORK_LOCATIONS = [
    { id: 'OFFICE', label: 'Office', icon: 'office-building' },
    { id: 'WFH', label: 'Work from home', icon: 'home' },
    { id: 'CLIENT', label: 'Client', icon: 'account-group' },
];

export const OFFICE_LOCATION = {
    LATITUDE: 13.056962959094266,
    LONGITUDE: 80.25724701078964,
    RADIUS: 150, // in meters
};
