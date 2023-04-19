export default function validateAdminKey(key: string ) {
    if (key === "auth-key") {
        return true;
    }
    else {
        return false;
    }
};
