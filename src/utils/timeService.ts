import dotenv from "dotenv";

dotenv.config();
const startTimeEnv = process.env.START_TIME;
const timeMultiplierEnv = process.env.TIME_MULTIPLIER || "1";

// Parse the start time from the environment variable or use the current time
const startTime = startTimeEnv ? new Date(startTimeEnv) : new Date();

// Parse the time multiplier from the environment variable or use 1 as the default value
const timeMultiplier = parseFloat(timeMultiplierEnv);

// Calculate the time difference between the start time and the current time, taking the time multiplier into account
const getTimeDifference = (): number => {
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - startTime.getTime();
    return timeDifference * timeMultiplier;
};

export const getDate = (): Date => {
    const timeDifference = getTimeDifference();
    const simulatedTime = new Date(startTime.getTime() + timeDifference);
    return simulatedTime;
};

export const getTimestamp = (): number => {
    const simulatedDate = getDate();
    return simulatedDate.getTime();
};
