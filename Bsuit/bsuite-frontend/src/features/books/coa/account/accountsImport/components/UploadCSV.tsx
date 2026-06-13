import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { useAppDispatch } from "../../../../../../store/store";
import { setRawFile, setUploadedFiles } from "../CSVSlice";
import CSVStats from "./CSVStats";
import FileDropZone from "./FileDropZone";

import Papa from "papaparse";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { useGetDemoCSVforAccountsMutation } from "../api/accountsImport.api";
import { Snackbar } from "../../../../../../components/atom/snackbar";
export interface DataRow {
  [key: string]: string | number;
}
function UploadCSV() {
  const [getDemoCSV, { isLoading }] = useGetDemoCSVforAccountsMutation();
  const handleDownload = async () => {
    try {
      const blob = await getDemoCSV().unwrap();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "AccountSample.csv"; // set filename
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    }
  };
  const [data, setData] = useState<Record<string, string>[]>([]);
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const isValidCsvFile = (file: File) => {
    const validMimeTypes = ["text/csv", "application/vnd.ms-excel", ""];

    const hasCsvExtension = file.name.toLowerCase().endsWith(".csv");

    return hasCsvExtension || validMimeTypes.includes(file.type);
  };

  const handleFileUpload = (file: File) => {
    if (!isValidCsvFile(file)) {
      setError("Only CSV files are allowed.");
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
        dispatch(setRawFile(results.data));
       if(results.data.length > 0){ setError(null); dispatch(setUploadedFiles(file));}
        else{
          setError("No data found in the uploaded file.");
        }
        // dispatch(setIndex(1));
      },
      error: (err) => {
        console.error("Error parsing CSV:", err);
      },
    });
  };
  return (
    <Box>
      <Box
        sx={{
          gap: 2,
          // height: "calc(84vh - 120px)",
          display: "flex",
          flexDirection:"column",
          justifyContent: "center",
          alignItems: "center",
          // flexDirection: "column",
          // width:"100%"
        }}
      >
        <FileDropZone onFileUpload={handleFileUpload} />
        <PrimaryButton onClick={handleDownload} disabled={isLoading}>
          Download Sample CSV
        </PrimaryButton>
        {/* <pre style={{ textAlign: "left", marginTop: "1rem" }}>
        {JSON.stringify(data, null, 2)}
      </pre> */}
        {data.length > 0 && <CSVStats data={data} />}
        {error && <Snackbar message={error}color="error" 
          onClose={()=>{setError(null)}} />}
      </Box>
    </Box>
  );
}

export default UploadCSV;
