export const calculateSRS = (
    quality: number,
    prevInterval: number | null,
    prevEaseFactor: number | null,
    prevRepetitions: number | null
) => {
    let interval = prevInterval || 0;
    let easeFactor = prevEaseFactor || 2.5;
    let repetitions = prevRepetitions || 0;

    if (quality >= 3) {
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
    } else {
        repetitions = 0;
        interval = 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    return { interval, easeFactor, repetitions };
};
