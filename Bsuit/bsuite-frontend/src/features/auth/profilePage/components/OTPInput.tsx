import * as React from "react";
import { Box, styled } from "@mui/system";
import { InputBase } from "@mui/material";

type OTPProps = {
  separator: React.ReactNode;
  length: number;
  value: string;
  onChange: React.Dispatch<React.SetStateAction<string>>;
};

function OTP({ separator, length, value, onChange }: OTPProps) {
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>(
    Array(length).fill(null)
  );

  const focusInput = (idx: number) => {
    const input = inputRefs.current[idx];
    input?.focus();
  };

  const selectInput = (idx: number) => {
    const input = inputRefs.current[idx];
    input?.select();
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        if (idx > 0) {
          focusInput(idx - 1);
          selectInput(idx - 1);
        }
        break;
      case "ArrowRight":
        event.preventDefault();
        if (idx < length - 1) {
          focusInput(idx + 1);
          selectInput(idx + 1);
        }
        break;
      case "Backspace":
        event.preventDefault();
        onChange((prev) => {
          const arr = prev.split("");
          arr[idx] = "";
          return arr.join("");
        });
        if (idx > 0) {
          focusInput(idx - 1);
          selectInput(idx - 1);
        }
        break;
      case "Delete":
        event.preventDefault();
        onChange((prev) => {
          const arr = prev.split("");
          arr[idx] = "";
          return arr.join("");
        });
        break;
      // ignore space, up/down
      case " ":
      case "ArrowUp":
      case "ArrowDown":
        event.preventDefault();
        break;
      default:
        break;
    }
  };

  const handleChange = (
    event: React.FormEvent<HTMLInputElement>,
    idx: number
  ) => {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    if (!val) {
      // user cleared the field
      onChange((prev) => {
        const arr = prev.split("");
        arr[idx] = "";
        return arr.join("");
      });
      return;
    }

    // take only the last character typed
    const lastChar = val[val.length - 1];
    onChange((prev) => {
      const arr = prev.split("");
      arr[idx] = lastChar;
      return arr.join("");
    });

    if (idx < length - 1) {
      focusInput(idx + 1);
    }
  };

  const handleClick = (_: React.MouseEvent<HTMLInputElement>, idx: number) => {
    selectInput(idx);
  };

  const handlePaste = (
    event: React.ClipboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    event.preventDefault();
    const text = event.clipboardData
      .getData("text/plain")
      .trim()
      .slice(0, length);
    const arr = value.split("");
    for (let i = idx; i < length; i++) {
      const char = text[i - idx] ?? "";
      arr[i] = char;
    }
    onChange(arr.join(""));
  };

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      {Array.from({ length }).map((_, idx) => (
        <React.Fragment key={idx}>
          <InputBase
          
          type="number"
            inputRef={(el) => {
              inputRefs.current[idx] = el;
            }}
            inputProps={{
              value: value[idx] ?? "",
              onChange: (e) => handleChange(e as React.FormEvent<HTMLInputElement>, idx),
              onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, idx),
              onClick: (e : React.MouseEvent<HTMLInputElement>) => handleClick(e, idx),
              onPaste: (e : React.ClipboardEvent<HTMLInputElement>) => handlePaste(e, idx),
              style: { textAlign: "center" }, // optional
            }}
            slots={{ input: StyledInput }}
          />

          {idx !== length - 1 && separator}
        </React.Fragment>
      ))}
    </Box>
  );
}

export default function OTPInput({setOTP}:{setOTP:(arg0:string)=>void}) {
  const [otp, setOtp] = React.useState<string>(Array(6).fill("").join(""));
React.useEffect(()=>{
setOTP(otp)
},[otp])
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <OTP
        separator={<span>-</span>}
        length={6}
        value={otp}
        onChange={setOtp}
        
      />
      {/* <div>Entered value: {otp}</div> */}
    </Box>
  );
}

const blue = {
  100: "#DAECFF",
  200: "#80BFFF",
  400: "#3399FF",
  500: "#007FFF",
  600: "#0072E5",
  700: "#0059B2",
};

const grey = {
  50: "#F3F6F9",
  100: "#E5EAF2",
  200: "#DAE2ED",
  300: "#C7D0DD",
  400: "#B0B8C4",
  500: "#9DA8B7",
  600: "#6B7A90",
  700: "#434D5B",
  800: "#303740",
  900: "#1C2025",
};

const StyledInput = styled("input")(
  ({ theme }) => `
  width: 40px;
  font-size: 0.875rem;
  padding: 8px 0;
  border-radius: 8px;
  text-align: center;
  color: black;
  background: ${theme.palette.mode === "dark" ? grey[900] : "#fff"};
  border: 1px solid ${theme.palette.mode === "dark" ? grey[700] : grey[200]};
  box-shadow: 0 2px 4px ${
    theme.palette.mode === "dark" ? "rgba(0,0,0, 0.5)" : "rgba(0,0,0, 0.05)"
  };

  // Remove number input arrows
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &[type=number] {
    -moz-appearance: textfield; /* Firefox */
  }

  &:hover {
    border-color: ${blue[400]};
  }
  &:focus {
    border-color: ${blue[400]};
    box-shadow: 0 0 0 3px ${
      theme.palette.mode === "dark" ? blue[600] : blue[200]
    };
  }
  &:focus-visible {
    outline: 0;
  }
`
);

