import type { Cast, Embed } from "../types";

export const getDateFilter = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday etc
    console.log("day of week", dayOfWeek);
    const daysFromTuesday = (dayOfWeek < 2 ? 7 : 0) + dayOfWeek - 2;
    console.log("days from tues", daysFromTuesday);

    const tuesday = new Date(today); // make copy of today's date
    tuesday.setDate(today.getDate() - daysFromTuesday); // subtract daysFromTuesday from the days of the month

    console.log("tuesday", tuesday);

    tuesday.setHours(0, 0, 0, 0);

    return tuesday;
};
