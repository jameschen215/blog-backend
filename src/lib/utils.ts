type GetRandomIntProps = {
  min?: number;
  max: number;
};

export const getRandomInt = ({ min = 1, max }: GetRandomIntProps): number => {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error('min and max must be integers');
  }

  if (min > max) {
    throw new Error('min must be <= max');
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
};
