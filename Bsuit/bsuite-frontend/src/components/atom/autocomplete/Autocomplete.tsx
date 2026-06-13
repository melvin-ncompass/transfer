
import { Autocomplete, TextField } from "@mui/material";
import { useState } from "react";
import { Chip } from "../chips";

interface AutocompleteElementProps<T> {
    options: T[];
    value: any;
    onChange: (event: any, value: any) => void;
    label?: string;
    placeholder?: string;
    matchId?: boolean;
    multiple?: boolean;
    freeSolo?: boolean;
    [key: string]: any;
}

export function AutocompleteElement<T>({
    options,
    value,
    onChange,
    label,
    placeholder,
    matchId,
    multiple=false,
    freeSolo=false,
    ...rest
}: AutocompleteElementProps<T>) {
    const [inputValue, setInputValue] = useState("");

    /*
    Comma support for Chips when multiple freesolo enabled
    */
   const handleKeyDown = (event: React.KeyboardEvent) => {
    if (
        freeSolo &&
        multiple &&
        event.key === "," &&
        inputValue.trim() !== ""
    ) {
        event.preventDefault();

        const newValue = inputValue.replace(",", "").trim();

        if (!value?.some((v: string) => v.toLowerCase() === newValue.toLowerCase())) {
        onChange(event, [...(value || []), newValue]);
        }
        setInputValue("");
    }
    };

    return (
        <Autocomplete
            options={options}
            value={value}
            onChange={onChange}
            isOptionEqualToValue={(option: any, value: any) => {
                if (matchId && option?.value && value?.value) {
                    return option.value === value.value;
                }
                return option === value;
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    size="small"
                    onKeyDown={handleKeyDown}
                    // Add styling similar to TextFieldElement if needed
                    sx={{
                        "& .MuiInputBase-root": {
                            borderRadius: "8px",
                            // padding: "4px 8px !important", 
                            paddingTop: multiple && value?.length > 0 ? "9px" : undefined,
                            paddingBottom: multiple && value?.length > 0 ? "9px" : undefined,
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                            borderRadius: "8px",
                        },
                    }}
                />
            )}
            slotProps={{
                paper: {
                    elevation: 0
                },
                popper: {
                    sx: {
                        boxShadow: "none"
                    }
                }
            }}
            multiple={multiple}
            freeSolo={freeSolo}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue);
            }}
            renderTags={(tagValue, getTagProps) =>
                tagValue.map((option: any, index: number) => (
                    <Chip
                        label={typeof option === "string" ? option : option?.label}
                        {...getTagProps({ index })}
                        key={index}
                    />
                ))
            }
            {...rest}
        />
    );
}
