export const getDateFilter = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday etc
    const daysFromTuesday = (dayOfWeek < 2 ? 7 : 0) + dayOfWeek - 2;

    const tuesday = new Date(today); // make copy of today's date
    tuesday.setDate(today.getDate() - daysFromTuesday); // subtract daysFromTuesday from the days of the month

    tuesday.setHours(23, 59, 59);

    return tuesday;
};
