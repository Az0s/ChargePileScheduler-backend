import { v4 as uuidv4 } from "uuid";

const generateUuids = (count: number): string[] => {
    const uuids = [];
    for (let i = 0; i < count; i++) {
        uuids.push(uuidv4());
    }
    return uuids;
};

const uuids = generateUuids(5);
console.log(uuids);
