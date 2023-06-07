import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const startTimeFile = path.join(__dirname, "startTime.conf");

dotenv.config();
// const startTimeEnv = process.env.START_TIME;

const timeMultiplierEnv = process.env.TIME_MULTIPLIER || "1";

// Parse the start time from the environment variable or use the current time
// const startTime = startTimeEnv ? new Date(startTimeEnv) : new Date();

let startTime: Date;

if (fs.existsSync(startTimeFile)) {
    const startTimeStr = fs.readFileSync(startTimeFile, "utf-8");
    startTime = new Date(startTimeStr);
    console.log("Using start time from file");
    console.table({ startTime, localTime: startTime.toString() });
} else if (process.env.START_TIME) {
    startTime = new Date(process.env.START_TIME);
    fs.writeFileSync(startTimeFile, startTime.toISOString(), "utf-8");
    console.log("Using start time from environment variable");
    console.table({ startTime, localTime: startTime.toString() });
} else {
    startTime = new Date();
    fs.writeFileSync(startTimeFile, startTime.toISOString(), "utf-8");
    console.log("Using current time as start time");
    console.table({ startTime, localTime: startTime.toString() });
}
const startUpTime = new Date();
// Parse the time multiplier from the environment variable or use 1 as the default value
const timeMultiplier = parseFloat(timeMultiplierEnv);

// Calculate the time difference between the start time and the current time, taking the time multiplier into account
const getTimeDifference = (): number => {
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - startUpTime.getTime();
    return timeDifference * timeMultiplier;
};

export const getDate = (): Date => {
    const timeDifference = getTimeDifference();
    const simulatedTime = new Date(startTime.getTime() + timeDifference);
    fs.writeFileSync(startTimeFile, simulatedTime.toISOString(), "utf-8");
    return simulatedTime;
};

export const getTimestamp = (): number => {
    const simulatedDate = getDate();
    return simulatedDate.getTime();
};
