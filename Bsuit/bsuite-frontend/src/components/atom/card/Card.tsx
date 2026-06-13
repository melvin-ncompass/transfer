import { Card, type CardProps, useTheme } from '@mui/material';

interface CardAtomProps extends Omit<CardProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'none';
}

const CardAtom = ({ variant = 'none', sx, ...props }: CardAtomProps) => {
  const theme = useTheme();

  let backgroundColor;
  if (variant === 'primary') {
    backgroundColor = theme.palette.primary.light;
  } else if (variant === 'secondary') {
    backgroundColor = theme.palette.secondary.light;
  } else {
    backgroundColor = 'white';
  }

  return (
    <Card
      {...props}
      sx={{
        ...sx,
        backgroundColor, // ensures variant color always takes priority
      }}
    />
  );
};

export default CardAtom;