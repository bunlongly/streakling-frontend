'use client';

import * as React from 'react';
import { TextField, type TextFieldProps } from '@mui/material';

const TextFieldPro = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ sx, ...props }, ref) => {
    return (
      <TextField
        inputRef={ref}
        fullWidth
        variant='outlined'
        {...props}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.paper',
            boxShadow:
              '0 1px 2px rgba(10,10,15,0.06), 0 8px 18px rgba(10,10,15,0.06)',
            '&:hover fieldset': { borderColor: 'primary.main' },
            '&.Mui-focused fieldset': { borderColor: 'primary.main' }
          },
          ...sx
        }}
      />
    );
  }
);

TextFieldPro.displayName = 'TextFieldPro';
export default TextFieldPro;
