import * as React from 'react';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const primaryColor = '#000000';

/**
 * This component is from https://mui.com/material-ui/react-number-field/;
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SSRInitialFilled(_: BaseNumberField.Root.Props) {
  return null;
}
SSRInitialFilled.muiName = 'Input';

export default function NumberField({
  id: idProp,
  label,
  error,
  size = 'medium',
  inputRef,
  ...other
}: BaseNumberField.Root.Props & {
  label?: React.ReactNode;
  size?: 'small' | 'medium';
  error?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  let id = React.useId();
  if (idProp) {
    id = idProp;
  }
  return (
    <BaseNumberField.Root
      allowWheelScrub
      {...other}
      render={(props, state) => (
        <FormControl
          size={size}
          ref={props.ref}
          disabled={state.disabled}
          required={state.required}
          error={error}
          variant="outlined"
        >
          {props.children}
        </FormControl>
      )}
    >
      <SSRInitialFilled {...other} />
      
      <InputLabel 
        htmlFor={id} 
        sx={{ 
            color: primaryColor,
            '&.Mui-focused': { color: primaryColor } 
        }}
      >
        {label}
      </InputLabel>

      <BaseNumberField.Input
        id={id}
        render={(props, state) => (
          <OutlinedInput
            label={label}
            inputRef={(node) => {
                if (typeof props.ref === 'function') {
                    props.ref(node);
                } else if (props.ref) {
                    (props.ref as React.MutableRefObject<HTMLInputElement>).current = node;
                }
                
                if (typeof inputRef === 'function') {
                    inputRef(node);
                } else if (inputRef) {
                    (inputRef as React.MutableRefObject<HTMLInputElement>).current = node;
                }
            }}
            value={state.inputValue}
            onBlur={props.onBlur}
            onChange={props.onChange}
            onKeyUp={props.onKeyUp}
            onKeyDown={props.onKeyDown}
            onFocus={props.onFocus}
            sx={{
                color: primaryColor,
                '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: primaryColor,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: primaryColor,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: primaryColor,
                }
            }}
            slotProps={{
              input: props,
            }}
            endAdornment={
              <InputAdornment
                position="end"
                sx={{
                  flexDirection: 'column',
                  maxHeight: 'unset',
                  alignSelf: 'stretch',
                  borderLeft: '1px solid',
                  borderColor: primaryColor, 
                  ml: 0,
                  '& button': {
                    py: 0,
                    flex: 1,
                    borderRadius: 0.5,
                    color: primaryColor 
                  },
                }}
              >
                <BaseNumberField.Increment
                  render={<IconButton size={size} aria-label="Increase" />}
                >
                  <KeyboardArrowUpIcon
                    fontSize={size}
                    sx={{ transform: 'translateY(2px)', color: primaryColor }}
                  />
                </BaseNumberField.Increment>

                <BaseNumberField.Decrement
                  render={<IconButton size={size} aria-label="Decrease" />}
                >
                  <KeyboardArrowDownIcon
                    fontSize={size}
                    sx={{ transform: 'translateY(-2px)', color: primaryColor }}
                  />
                </BaseNumberField.Decrement>
              </InputAdornment>
            }
          />
        )}
      />
    </BaseNumberField.Root>
  );
}